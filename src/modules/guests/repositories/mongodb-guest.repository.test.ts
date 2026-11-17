import { ObjectId, type Db, type MongoClient } from "mongodb";
import { describe, expect, it, vi } from "vitest";
import { MongoGuestRepository } from "@/modules/guests/repositories/mongodb-guest.repository";

function transactionalClient() {
  const session = {
    withTransaction: vi.fn(async (operation: () => Promise<unknown>) => operation()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  return {
    client: { startSession: () => session } as unknown as MongoClient,
    session,
  };
}

function guestDocument(weddingId: ObjectId) {
  const now = new Date("2026-11-17T08:00:00.000Z");
  return {
    _id: new ObjectId(),
    weddingId,
    guestType: "INDIVIDUAL" as const,
    displayName: { en: "Rahul Sharma" },
    primaryContact: { name: { en: "Rahul Sharma" } },
    tags: ["FRIENDS" as const],
    status: "ACTIVE" as const,
    deletedAt: null,
    createdByMembershipId: new ObjectId(),
    createdAt: now,
    updatedAt: now,
  };
}

function eventAssignment(
  weddingId: ObjectId,
  guestId: ObjectId,
  eventId: ObjectId,
) {
  const now = new Date("2026-11-17T08:00:00.000Z");
  return {
    _id: new ObjectId(),
    weddingId,
    guestId,
    guestInvitationId: new ObjectId(),
    eventId,
    invitationStatus: "ACTIVE" as const,
    rsvpStatus: "AWAITING_RESPONSE" as const,
    attendeeCount: null,
    removedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe("Mongo guest editable event assignments", () => {
  it("excludes assignments to deleted events from guest edit data", async () => {
    const weddingId = new ObjectId();
    const guest = guestDocument(weddingId);
    const activeEventId = new ObjectId();
    const deletedEventId = new ObjectId();
    const assignments = [
      eventAssignment(weddingId, guest._id, deletedEventId),
      eventAssignment(weddingId, guest._id, activeEventId),
    ];
    const assignmentCursor = {
      sort: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue(assignments),
    };
    const activeEventCursor = {
      toArray: vi.fn().mockResolvedValue([
        { _id: activeEventId, weddingId, status: "ACTIVE" },
      ]),
    };
    const guests = { findOne: vi.fn().mockResolvedValue(guest) };
    const eventInvitations = {
      find: vi.fn().mockReturnValue(assignmentCursor),
    };
    const events = { find: vi.fn().mockReturnValue(activeEventCursor) };
    const database = {
      collection: vi.fn((name: string) => {
        if (name === "guests") return guests;
        if (name === "guestEventInvitations") return eventInvitations;
        if (name === "events") return events;
        return {};
      }),
    } as unknown as Db;
    const repository = new MongoGuestRepository({} as MongoClient, database);

    const details = await repository.findActiveById(
      weddingId.toHexString(),
      guest._id.toHexString(),
    );

    expect(details?.eventIds).toEqual([activeEventId.toHexString()]);
    expect(events.find).toHaveBeenCalledWith(
      {
        _id: { $in: [deletedEventId, activeEventId] },
        weddingId,
        status: "ACTIVE",
      },
      { projection: { _id: 1 } },
    );
  });

  it("preserves a deleted event relationship while saving active selections", async () => {
    const now = new Date("2026-11-17T09:00:00.000Z");
    const weddingId = new ObjectId();
    const guest = guestDocument(weddingId);
    const guestInvitationId = new ObjectId();
    const deletedEventId = new ObjectId();
    const activeEventId = new ObjectId();
    const newlySelectedEventId = new ObjectId();
    const deletedAssignment = eventAssignment(
      weddingId,
      guest._id,
      deletedEventId,
    );
    const activeAssignment = eventAssignment(
      weddingId,
      guest._id,
      activeEventId,
    );
    const currentAssignments = [deletedAssignment, activeAssignment];
    const currentCursor = {
      toArray: vi.fn().mockResolvedValue(currentAssignments),
    };
    const editableEventCursor = {
      toArray: vi.fn().mockResolvedValue([
        { _id: activeEventId, weddingId, status: "ACTIVE" },
      ]),
    };
    const guests = { findOne: vi.fn().mockResolvedValue({ _id: guest._id }) };
    const invitations = {
      findOne: vi.fn().mockResolvedValue({ _id: guestInvitationId }),
    };
    const eventInvitations = {
      find: vi.fn().mockReturnValue(currentCursor),
      updateMany: vi.fn(),
      updateOne: vi.fn(),
      insertOne: vi.fn().mockResolvedValue({ acknowledged: true }),
    };
    const events = {
      countDocuments: vi.fn().mockResolvedValue(2),
      find: vi.fn().mockReturnValue(editableEventCursor),
    };
    const database = {
      collection: vi.fn((name: string) => {
        if (name === "guests") return guests;
        if (name === "guestInvitations") return invitations;
        if (name === "guestEventInvitations") return eventInvitations;
        if (name === "events") return events;
        return {};
      }),
    } as unknown as Db;
    const { client } = transactionalClient();
    const repository = new MongoGuestRepository(client, database);

    await expect(
      repository.replaceEventAssignments(
        weddingId.toHexString(),
        guest._id.toHexString(),
        [activeEventId.toHexString(), newlySelectedEventId.toHexString()],
        now,
      ),
    ).resolves.toBe(true);

    expect(eventInvitations.updateMany).not.toHaveBeenCalled();
    expect(eventInvitations.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        weddingId,
        guestId: guest._id,
        guestInvitationId,
        eventId: newlySelectedEventId,
        invitationStatus: "ACTIVE",
      }),
      { session: expect.any(Object) },
    );
  });
});
