import { describe, expect, it, vi } from "vitest";
import {
  GuestInvitationCampaignValidationError,
  PendingGuestInvitationCampaignError,
  type CreateCampaignRecord,
  type DeliveryResult,
  type GuestInvitationRepository,
} from "@/modules/guest-invitations/guest-invitation.repository";
import { GuestInvitationService } from "@/modules/guest-invitations/guest-invitation.service";
import type {
  CampaignRecipient,
  EmailCampaignStatus,
  InvitationAccessContext,
  InvitationCampaignProgress,
  InvitationEmailContext,
  InvitationHubResult,
} from "@/modules/guest-invitations/guest-invitation.types";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import type { GuestInvitationMailer } from "@/server/providers/resend/guest-invitation-mailer";

const membership: OrganizerMembershipContext = {
  id: "690092d1b617241033eaa222",
  weddingId: "690092d1b617241033eaa333",
  role: "ADMIN",
};
const now = new Date("2026-11-18T08:00:00.000Z");

function campaign(overrides: Partial<InvitationCampaignProgress> = {}): InvitationCampaignProgress {
  return {
    id: "690092d1b617241033eaa444",
    status: "DRAFT",
    totalRecipients: 1,
    pending: 1,
    sent: 0,
    failed: 0,
    createdByMembershipId: membership.id,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeRepository implements GuestInvitationRepository {
  current = campaign();
  contexts: InvitationEmailContext[] = [];
  created: CreateCampaignRecord | null = null;
  createError: unknown = null;
  results: DeliveryResult[] = [];
  restored: { weddingId: string; guestId: string; accessKey: string; now: Date } | null = null;
  retryCreated: { weddingId: string; campaignId: string; createdByMembershipId: string; now: Date } | null = null;

  async listHub(): Promise<InvitationHubResult> { throw new Error("unused"); }
  async createCampaign(input: CreateCampaignRecord) {
    this.created = input;
    if (this.createError) throw this.createError;
    return this.current;
  }
  async getCampaign(weddingId: string, campaignId: string) { return weddingId === membership.weddingId && campaignId === this.current.id ? this.current : null; }
  async listCampaignRecipients(): Promise<{ recipients: CampaignRecipient[]; total: number }> { return { recipients: [], total: 0 }; }
  async getPendingEmailContexts() { return this.contexts; }
  async markCampaignSending() { return true; }
  async recordDeliveryResults(_weddingId: string, _campaignId: string, results: DeliveryResult[]) { this.results = results; this.current = campaign({ status: results.every((item) => item.sent) ? "COMPLETED" : "FAILED", pending: 0, sent: results.filter((item) => item.sent).length, failed: results.filter((item) => !item.sent).length, completedAt: now }); return this.current; }
  async createRetryCampaign(weddingId: string, campaignId: string, createdByMembershipId: string, retryAt: Date) { this.retryCreated = { weddingId, campaignId, createdByMembershipId, now: retryAt }; this.current = campaign({ status: "DRAFT" }); return this.current; }
  async revokeInvitation() { return true; }
  async restoreInvitation(weddingId: string, guestId: string, accessKey: string, restoredAt: Date) { this.restored = { weddingId, guestId, accessKey, now: restoredAt }; return true; }
  async updateGuestEmail() { return true; }
  async resolveActiveAccess(): Promise<InvitationAccessContext | null> { return null; }
  async updateCampaignStatus(_weddingId: string, _campaignId: string, status: EmailCampaignStatus) { this.current = campaign({ status }); return this.current; }
}

function mailContext(): InvitationEmailContext {
  return {
    recipientId: "recipient-1",
    campaignId: campaign().id,
    guestId: "guest-1",
    guestInvitationId: "invitation-1",
    accessKey: "private-key",
    attemptCount: 0,
    recipientEmail: "guest@example.com",
    guestName: "Guest Family",
    primaryContactName: "Guest",
    guestType: "FAMILY",
    coupleName: "Anant & Radhika",
    weddingTitle: "Our Forever Begins",
    weddingDate: now,
    weddingTimezone: "Asia/Kolkata",
    weddingCity: "Virar",
    events: [],
  };
}

describe("GuestInvitationService", () => {
  it("creates campaigns inside the organizer's wedding tenant", async () => {
    const repository = new FakeRepository();
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() }, now: () => now });

    await service.createCampaign(membership, { guestIds: ["guest-1"], resend: false });

    expect(repository.created).toMatchObject({ weddingId: membership.weddingId, createdByMembershipId: membership.id, createdAt: now });
  });

  it("maps only explicit campaign validation failures to a safe client error", async () => {
    const repository = new FakeRepository();
    repository.createError = new GuestInvitationCampaignValidationError(
      "Every selected guest must have at least one active ceremony assigned.",
    );
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() } });

    await expect(
      service.createCampaign(membership, { guestIds: ["guest-1"], resend: false }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "Every selected guest must have at least one active ceremony assigned.",
    });
  });

  it("maps an explicit pending campaign race to a conflict", async () => {
    const repository = new FakeRepository();
    repository.createError = new PendingGuestInvitationCampaignError();
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() } });

    await expect(
      service.createCampaign(membership, { guestIds: ["guest-1"], resend: false }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("rethrows unknown repository failures for infrastructure error handling", async () => {
    const repository = new FakeRepository();
    const databaseError = new Error(
      "E11000 duplicate key collection: guest_invitation_campaign_recipients index: pending_guest",
    );
    repository.createError = databaseError;
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() } });

    await expect(
      service.createCampaign(membership, { guestIds: ["guest-1"], resend: false }),
    ).rejects.toBe(databaseError);
  });

  it("records successful provider results and completes the batch", async () => {
    const repository = new FakeRepository();
    repository.contexts = [mailContext()];
    const mailer: GuestInvitationMailer = { sendBatch: vi.fn().mockResolvedValue([{ recipientId: "recipient-1", sent: true, providerMessageId: "email-1" }]) };
    const service = new GuestInvitationService({ repository, mailer, now: () => now });

    const result = await service.sendNext(membership, repository.current.id);

    expect(mailer.sendBatch).toHaveBeenCalledWith(repository.contexts);
    expect(repository.results).toEqual([{ recipientId: "recipient-1", sent: true, providerMessageId: "email-1" }]);
    expect(result.campaign).toMatchObject({ status: "COMPLETED", sent: 1, pending: 0 });
  });

  it("never exposes a campaign from another wedding", async () => {
    const repository = new FakeRepository();
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() } });

    await expect(service.getCampaign({ ...membership, weddingId: "another-wedding" }, repository.current.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("restores a revoked invitation with a newly generated private key", async () => {
    const repository = new FakeRepository();
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() }, now: () => now, invitationKey: () => "new-private-key" });

    await service.restore(membership, "guest-1");

    expect(repository.restored).toEqual({ weddingId: membership.weddingId, guestId: "guest-1", accessKey: "new-private-key", now });
  });

  it("creates a fresh retry campaign under the current organizer membership", async () => {
    const repository = new FakeRepository();
    const service = new GuestInvitationService({ repository, mailer: { sendBatch: vi.fn() }, now: () => now });

    const retried = await service.retryFailed(membership, repository.current.id);

    expect(repository.retryCreated).toEqual({ weddingId: membership.weddingId, campaignId: repository.current.id, createdByMembershipId: membership.id, now });
    expect(retried.status).toBe("DRAFT");
  });
});
