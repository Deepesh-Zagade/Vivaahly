import { ObjectId, type Db, type MongoClient } from "mongodb";
import { describe, expect, it, vi } from "vitest";
import { MongoOrganizerRepository } from "@/modules/organizers/repositories/mongodb-organizer.repository";

describe("Mongo organizer invitation access", () => {
  it("does not expire an invitation that was concurrently rotated", async () => {
    const now = new Date("2026-11-01T10:00:00.000Z");
    const expiredAt = new Date("2026-11-01T09:00:00.000Z");
    const invitationId = new ObjectId();
    const invitations = {
      findOne: vi.fn().mockResolvedValue({
        _id: invitationId,
        weddingId: new ObjectId(),
        email: "family@example.com",
        emailNormalized: "family@example.com",
        role: "MANAGER",
        tokenHash: "observed-token-hash",
        status: "PENDING",
        invitedByMembershipId: new ObjectId(),
        expiresAt: expiredAt,
        acceptedAt: null,
        acceptedByUserId: null,
        createdAt: new Date("2026-10-25T09:00:00.000Z"),
        updatedAt: new Date("2026-10-25T09:00:00.000Z"),
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
    };
    const database = {
      collection: vi.fn((name: string) =>
        name === "organizerInvitations" ? invitations : {},
      ),
    } as unknown as Db;
    const repository = new MongoOrganizerRepository(
      {} as MongoClient,
      database,
    );

    await expect(
      repository.findInvitationAccessByTokenHash("observed-token-hash", now),
    ).resolves.toBeNull();
    expect(invitations.updateOne).toHaveBeenCalledWith(
      {
        _id: invitationId,
        status: "PENDING",
        tokenHash: "observed-token-hash",
        expiresAt: expiredAt,
      },
      { $set: { status: "EXPIRED", updatedAt: now } },
    );
  });
});
