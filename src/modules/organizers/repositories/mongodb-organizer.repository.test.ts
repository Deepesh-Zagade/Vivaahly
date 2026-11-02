import { ObjectId, type Db, type MongoClient } from "mongodb";
import { describe, expect, it, vi } from "vitest";
import {
  FinalOrganizerAdminError,
  SelfOrganizerManagementError,
} from "@/modules/organizers/organizer.repository";
import { MongoOrganizerRepository } from "@/modules/organizers/repositories/mongodb-organizer.repository";

function transactionalClient() {
  const session = {
    withTransaction: vi.fn(async (operation: () => Promise<unknown>) => operation()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  return { client: { startSession: () => session } as unknown as MongoClient, session };
}

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

describe("Mongo organizer membership management", () => {
  it("guards the final Admin behind the wedding membership lock", async () => {
    const now = new Date("2026-11-02T10:00:00.000Z");
    const weddingId = new ObjectId();
    const memberId = new ObjectId();
    const actorMemberId = new ObjectId();
    const weddings = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ _id: weddingId, status: "ACTIVE" }),
    };
    const members = {
      findOne: vi.fn().mockResolvedValue({
        _id: memberId,
        weddingId,
        userId: new ObjectId(),
        role: "ADMIN",
        status: "ACTIVE",
        joinedAt: now,
        removedAt: null,
        createdAt: now,
        updatedAt: now,
      }),
      countDocuments: vi.fn().mockResolvedValue(1),
      findOneAndUpdate: vi.fn(),
    };
    const database = {
      collection: vi.fn((name: string) => {
        if (name === "weddings") return weddings;
        if (name === "weddingMembers") return members;
        return {};
      }),
    } as unknown as Db;
    const { client } = transactionalClient();
    const repository = new MongoOrganizerRepository(client, database);

    await expect(
      repository.updateMemberRole({
        weddingId: weddingId.toHexString(),
        actorMemberId: actorMemberId.toHexString(),
        memberId: memberId.toHexString(),
        role: "MANAGER",
        updatedAt: now,
      }),
    ).rejects.toBeInstanceOf(FinalOrganizerAdminError);
    expect(weddings.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: weddingId, status: "ACTIVE" },
      {
        $inc: { membershipVersion: 1 },
        $set: { updatedAt: now },
      },
      { session: expect.any(Object), returnDocument: "after" },
    );
    expect(members.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects case-variant self-management IDs before starting a transaction", async () => {
    const weddingId = new ObjectId();
    const memberId = new ObjectId();
    const { client, session } = transactionalClient();
    const database = {
      collection: vi.fn(() => ({})),
    } as unknown as Db;
    const repository = new MongoOrganizerRepository(client, database);
    const common = {
      weddingId: weddingId.toHexString(),
      actorMemberId: memberId.toHexString(),
      memberId: memberId.toHexString().toUpperCase(),
    };

    await expect(
      repository.updateMemberRole({ ...common, role: "MANAGER", updatedAt: new Date() }),
    ).rejects.toBeInstanceOf(SelfOrganizerManagementError);
    await expect(
      repository.removeMember({ ...common, removedAt: new Date() }),
    ).rejects.toBeInstanceOf(SelfOrganizerManagementError);
    expect(session.withTransaction).not.toHaveBeenCalled();
  });

  it("reactivates the existing membership when a removed organizer rejoins", async () => {
    const now = new Date("2026-11-02T10:00:00.000Z");
    const weddingId = new ObjectId();
    const userId = new ObjectId();
    const membershipId = new ObjectId();
    const invitationId = new ObjectId();
    const invitation = {
      _id: invitationId,
      weddingId,
      email: "family@example.com",
      emailNormalized: "family@example.com",
      role: "ADMIN" as const,
      tokenHash: "token-hash",
      status: "PENDING" as const,
      invitedByMembershipId: new ObjectId(),
      expiresAt: new Date("2026-11-09T10:00:00.000Z"),
      acceptedAt: null,
      acceptedByUserId: null,
      createdAt: now,
      updatedAt: now,
    };
    const user = {
      _id: userId,
      name: "Family Member",
      email: invitation.email,
      emailNormalized: invitation.emailNormalized,
      passwordHash: "hash",
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    };
    const removedMembership = {
      _id: membershipId,
      weddingId,
      userId,
      role: "MANAGER" as const,
      status: "REMOVED" as const,
      joinedAt: new Date("2026-10-01T10:00:00.000Z"),
      removedAt: new Date("2026-10-20T10:00:00.000Z"),
      createdAt: new Date("2026-10-01T10:00:00.000Z"),
      updatedAt: new Date("2026-10-20T10:00:00.000Z"),
    };
    const reactivatedMembership = {
      ...removedMembership,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      joinedAt: now,
      removedAt: null,
      updatedAt: now,
    };
    const users = { findOne: vi.fn().mockResolvedValue(user) };
    const weddings = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ _id: weddingId, status: "ACTIVE" }),
    };
    const members = {
      findOne: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(removedMembership),
      findOneAndUpdate: vi.fn().mockResolvedValue(reactivatedMembership),
      insertOne: vi.fn(),
    };
    const invitations = {
      findOne: vi.fn().mockResolvedValue(invitation),
      findOneAndUpdate: vi.fn().mockResolvedValue({
        ...invitation,
        status: "ACCEPTED",
        acceptedAt: now,
        acceptedByUserId: userId,
        expiresAt: undefined,
      }),
    };
    const database = {
      collection: vi.fn((name: string) => {
        if (name === "users") return users;
        if (name === "weddings") return weddings;
        if (name === "weddingMembers") return members;
        if (name === "organizerInvitations") return invitations;
        return { insertOne: vi.fn() };
      }),
    } as unknown as Db;
    const { client } = transactionalClient();
    const repository = new MongoOrganizerRepository(client, database);

    const accepted = await repository.acceptInvitation({
      invitationId: invitationId.toHexString(),
      tokenHash: invitation.tokenHash,
      now,
      existingUserId: userId.toHexString(),
    });

    expect(accepted.membership.id).toBe(membershipId.toHexString());
    expect(accepted.membership).toMatchObject({
      role: "ADMIN",
      status: "ACTIVE",
      removedAt: null,
      joinedAt: now,
    });
    expect(members.insertOne).not.toHaveBeenCalled();
    expect(members.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: membershipId, status: "REMOVED" },
      {
        $set: {
          role: "ADMIN",
          status: "ACTIVE",
          joinedAt: now,
          removedAt: null,
          updatedAt: now,
        },
      },
      { session: expect.any(Object), returnDocument: "after" },
    );
  });
});
