import { describe, expect, it } from "vitest";
import {
  EventLimitReachedError,
  type CreateEventRecord,
  type EventRepository,
  type UpdateEventRecord,
} from "@/modules/events/event.repository";
import type { CreateEventInput } from "@/modules/events/event.schemas";
import { EventService } from "@/modules/events/event.service";
import type { WeddingEvent } from "@/modules/events/event.types";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import { ApplicationError } from "@/server/http/errors";

const now = new Date("2026-11-10T10:00:00.000Z");
const membership: OrganizerMembershipContext = {
  id: "690092d1b617241033eaa222",
  weddingId: "690092d1b617241033eaa333",
  role: "MANAGER",
};
const input: CreateEventInput = {
  title: { en: "Sangeet" },
  description: { en: "An evening of music and dance." },
  startAt: "2027-02-13T13:30:00.000Z",
  endAt: "2027-02-13T17:30:00.000Z",
  venue: { name: { en: "Royal Hall" }, address: {} },
  dressCode: {},
};

class FakeEventRepository implements EventRepository {
  events: WeddingEvent[] = [];
  rejectAtLimit = false;

  async findWeddingTimezone(weddingId: string) {
    return weddingId ? "Asia/Kolkata" : null;
  }

  async listActiveByWeddingId(weddingId: string) {
    return this.events.filter(
      (event) => event.weddingId === weddingId && event.status === "ACTIVE",
    );
  }

  async findActiveById(weddingId: string, eventId: string) {
    return (
      this.events.find(
        (event) =>
          event.id === eventId &&
          event.weddingId === weddingId &&
          event.status === "ACTIVE",
      ) ?? null
    );
  }

  async createWithCounter(record: CreateEventRecord) {
    if (this.rejectAtLimit) throw new EventLimitReachedError();
    const event: WeddingEvent = {
      id: `event-${this.events.length + 1}`,
      weddingId: record.weddingId,
      title: record.title,
      description: record.description,
      startAt: new Date(record.startAt),
      endAt: new Date(record.endAt),
      venue: record.venue,
      dressCode: record.dressCode,
      ...(record.privateNotes ? { privateNotes: record.privateNotes } : {}),
      sortOrder: this.events.length + 1,
      status: "ACTIVE",
      deletedAt: null,
      createdByMembershipId: record.createdByMembershipId,
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
    };
    this.events.push(event);
    return event;
  }

  async updateActive(
    weddingId: string,
    eventId: string,
    record: UpdateEventRecord,
  ) {
    const event = await this.findActiveById(weddingId, eventId);
    if (!event) return null;
    Object.assign(event, {
      ...record,
      startAt: new Date(record.startAt),
      endAt: new Date(record.endAt),
    });
    return event;
  }

  async softDeleteWithCounter(
    weddingId: string,
    eventId: string,
    deletedAt: Date,
  ) {
    const event = await this.findActiveById(weddingId, eventId);
    if (!event) return false;
    event.status = "DELETED";
    event.deletedAt = deletedAt;
    event.updatedAt = deletedAt;
    return true;
  }
}

describe("EventService", () => {
  it("creates an event inside the organizer's wedding tenant", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService({ repository, now: () => now });
    const event = await service.createEvent(membership, input);
    expect(event).toMatchObject({
      weddingId: membership.weddingId,
      createdByMembershipId: membership.id,
      title: { en: "Sangeet" },
    });
  });

  it("maps the atomic repository limit to a conflict", async () => {
    const repository = new FakeEventRepository();
    repository.rejectAtLimit = true;
    const service = new EventService({ repository });
    await expect(service.createEvent(membership, input)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    } satisfies Partial<ApplicationError>);
  });

  it("rejects creating an event on a past wedding-local date", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService({ repository, now: () => now });
    await expect(
      service.createEvent(membership, {
        ...input,
        startAt: "2026-11-09T13:30:00.000Z",
        endAt: "2026-11-09T17:30:00.000Z",
      }),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
      details: {
        fieldErrors: {
          startAt: ["Choose today or a future event date."],
        },
      },
    } satisfies Partial<ApplicationError>);
  });

  it("does not expose an event from another wedding", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService({ repository, now: () => now });
    const event = await service.createEvent(
      { ...membership, weddingId: "another-wedding" },
      input,
    );
    await expect(service.getEvent(membership, event.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    } satisfies Partial<ApplicationError>);
  });

  it("soft deletes an active event", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService({ repository, now: () => now });
    const event = await service.createEvent(membership, input);
    await service.removeEvent(membership, event.id);
    expect(repository.events[0]).toMatchObject({
      status: "DELETED",
      deletedAt: now,
    });
  });
});
