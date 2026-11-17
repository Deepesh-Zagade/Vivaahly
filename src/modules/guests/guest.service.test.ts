import { describe, expect, it } from "vitest";
import type {
  CreateGuestRecord,
  GuestRepository,
  UpdateGuestRecord,
} from "@/modules/guests/guest.repository";
import { GuestEventNotFoundError } from "@/modules/guests/guest.repository";
import type { GuestInput } from "@/modules/guests/guest.schemas";
import { GuestService } from "@/modules/guests/guest.service";
import type {
  GuestDetails,
  GuestListQuery,
  GuestListResult,
  GuestSummary,
  WeddingGuest,
} from "@/modules/guests/guest.types";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import type { ApplicationError } from "@/server/http/errors";

const now = new Date("2026-11-13T10:00:00.000Z");
const membership: OrganizerMembershipContext = {
  id: "690092d1b617241033eaa222",
  weddingId: "690092d1b617241033eaa333",
  role: "MANAGER",
};
const input: GuestInput = {
  guestType: "FAMILY",
  displayName: { en: "Kulkarni Family" },
  primaryContact: { name: { en: "Rajesh Kulkarni" } },
  tags: ["GROOM_SIDE", "RELATIVES"],
};

class FakeGuestRepository implements GuestRepository {
  guests: WeddingGuest[] = [];
  assignments = new Map<string, string[]>();
  rejectAssignments = false;

  async listActive(_weddingId: string, query: GuestListQuery): Promise<GuestListResult> {
    return { guests: this.guests, eventIdsByGuest: {}, total: this.guests.length, page: query.page, pageSize: query.pageSize, pageCount: this.guests.length ? 1 : 0, summary: await this.getSummary(_weddingId) };
  }
  async getSummary(weddingId: string): Promise<GuestSummary> {
    const guests = this.guests.filter((guest) => guest.weddingId === weddingId);
    return { total: guests.length, individual: guests.filter((guest) => guest.guestType === "INDIVIDUAL").length, family: guests.filter((guest) => guest.guestType === "FAMILY").length, brideSide: 0, groomSide: guests.length };
  }
  async findActiveById(weddingId: string, guestId: string): Promise<GuestDetails | null> {
    const guest = this.guests.find((candidate) => candidate.id === guestId && candidate.weddingId === weddingId && candidate.status === "ACTIVE");
    return guest ? { guest, eventIds: this.assignments.get(guest.id) ?? [] } : null;
  }
  async createWithInvitation(record: CreateGuestRecord): Promise<WeddingGuest> {
    const guest: WeddingGuest = { id: `guest-${this.guests.length + 1}`, weddingId: record.weddingId, guestType: record.guestType, displayName: record.displayName, primaryContact: record.primaryContact, tags: record.tags, ...(record.organizerNotes ? { organizerNotes: record.organizerNotes } : {}), status: "ACTIVE", deletedAt: null, createdByMembershipId: record.createdByMembershipId, createdAt: record.createdAt, updatedAt: record.createdAt };
    this.guests.push(guest);
    return guest;
  }
  async updateActive(weddingId: string, guestId: string, record: UpdateGuestRecord): Promise<WeddingGuest | null> {
    const details = await this.findActiveById(weddingId, guestId);
    if (!details) return null;
    Object.assign(details.guest, record);
    return details.guest;
  }
  async replaceEventAssignments(weddingId: string, guestId: string, eventIds: string[]): Promise<boolean> {
    if (this.rejectAssignments) throw new GuestEventNotFoundError();
    const details = await this.findActiveById(weddingId, guestId);
    if (!details) return false;
    this.assignments.set(guestId, eventIds);
    return true;
  }
  async softRemoveWithAccess(weddingId: string, guestId: string, removedAt: Date): Promise<boolean> {
    const details = await this.findActiveById(weddingId, guestId);
    if (!details) return false;
    details.guest.status = "REMOVED";
    details.guest.deletedAt = removedAt;
    return true;
  }
  async countActiveAssignmentsByEvent(_weddingId: string, eventIds: string[]): Promise<Record<string, number>> { return Object.fromEntries(eventIds.map((id) => [id, 0])); }
}

describe("GuestService", () => {
  it("creates a guest and its capability inside the organizer's wedding tenant", async () => {
    const repository = new FakeGuestRepository();
    const service = new GuestService({ repository, now: () => now, invitationKey: () => "secret-capability" });
    const guest = await service.createGuest(membership, input);
    expect(guest).toMatchObject({ weddingId: membership.weddingId, createdByMembershipId: membership.id, displayName: { en: "Kulkarni Family" } });
  });

  it("does not expose a guest from another wedding", async () => {
    const repository = new FakeGuestRepository();
    const service = new GuestService({ repository, now: () => now });
    const guest = await service.createGuest({ ...membership, weddingId: "another-wedding" }, input);
    await expect(service.getGuest(membership, guest.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 } satisfies Partial<ApplicationError>);
  });

  it("maps unavailable selected events to a field validation error", async () => {
    const repository = new FakeGuestRepository();
    const service = new GuestService({ repository, now: () => now });
    const guest = await service.createGuest(membership, input);
    repository.rejectAssignments = true;
    await expect(service.assignEvents(membership, guest.id, { eventIds: ["690092d1b617241033eaa444"] })).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400, details: { fieldErrors: { eventIds: ["One or more selected wedding events are unavailable."] } } } satisfies Partial<ApplicationError>);
  });

  it("soft-removes the guest through the tenant-scoped repository boundary", async () => {
    const repository = new FakeGuestRepository();
    const service = new GuestService({ repository, now: () => now });
    const guest = await service.createGuest(membership, input);
    await service.removeGuest(membership, guest.id);
    expect(repository.guests[0]).toMatchObject({ status: "REMOVED", deletedAt: now });
  });
});
