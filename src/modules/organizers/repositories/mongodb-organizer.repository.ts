import "server-only";

import {
  MongoServerError,
  ObjectId,
  type Collection,
  type Db,
  type MongoClient,
  type WithId,
} from "mongodb";
import type { OrganizerUser } from "@/modules/auth/auth.types";
import {
  OrganizerInvitationAccountExistsError,
  OrganizerInvitationActiveMembershipError,
  OrganizerInvitationUnavailableError,
  PendingOrganizerInvitationError,
  type AcceptOrganizerInvitationRecord,
  type CreateOrganizerInvitationRecord,
  type OrganizerRepository,
  type RotateOrganizerInvitationRecord,
} from "@/modules/organizers/organizer.repository";
import type { OrganizerInvitation } from "@/modules/organizers/organizer.types";
import type { Wedding, WeddingMembership } from "@/modules/wedding/wedding.types";

type UserDocument = Omit<OrganizerUser, "id">;
type SessionDocument = {
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastSeenAt: Date;
};
type WeddingDocument = Omit<Wedding, "id" | "createdByUserId"> & {
  createdByUserId: ObjectId;
};
type WeddingMemberDocument = Omit<WeddingMembership, "id" | "weddingId" | "userId"> & {
  weddingId: ObjectId;
  userId: ObjectId;
};
type OrganizerInvitationDocument = {
  weddingId: ObjectId;
  email: string;
  emailNormalized: string;
  role: "ADMIN" | "MANAGER";
  tokenHash: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  invitedByMembershipId: ObjectId;
  expiresAt?: Date;
  acceptedAt: Date | null;
  acceptedByUserId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapUser(document: WithId<UserDocument>): OrganizerUser {
  const { _id, ...user } = document;
  return { id: _id.toHexString(), ...user };
}

function mapWedding(document: WithId<WeddingDocument>): Wedding {
  const { _id, createdByUserId, ...wedding } = document;
  return {
    id: _id.toHexString(),
    ...wedding,
    createdByUserId: createdByUserId.toHexString(),
  };
}

function mapMembership(document: WithId<WeddingMemberDocument>): WeddingMembership {
  const { _id, weddingId, userId, ...membership } = document;
  return {
    id: _id.toHexString(),
    ...membership,
    weddingId: weddingId.toHexString(),
    userId: userId.toHexString(),
  };
}

function mapInvitation(document: WithId<OrganizerInvitationDocument>): OrganizerInvitation {
  return {
    id: document._id.toHexString(),
    weddingId: document.weddingId.toHexString(),
    email: document.email,
    emailNormalized: document.emailNormalized,
    role: document.role,
    tokenHash: document.tokenHash,
    status: document.status,
    invitedByMembershipId: document.invitedByMembershipId.toHexString(),
    expiresAt: document.expiresAt ?? null,
    acceptedAt: document.acceptedAt,
    acceptedByUserId: document.acceptedByUserId?.toHexString() ?? null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function duplicateKey(error: unknown, key: string) {
  if (!(error instanceof MongoServerError) || error.code !== 11_000) return false;
  const pattern = error.keyPattern as Record<string, number> | undefined;
  return Boolean(pattern?.[key]);
}

export class MongoOrganizerRepository implements OrganizerRepository {
  private readonly users: Collection<UserDocument>;
  private readonly sessions: Collection<SessionDocument>;
  private readonly weddings: Collection<WeddingDocument>;
  private readonly members: Collection<WeddingMemberDocument>;
  private readonly invitations: Collection<OrganizerInvitationDocument>;

  constructor(private readonly client: MongoClient, database: Db) {
    this.users = database.collection<UserDocument>("users");
    this.sessions = database.collection<SessionDocument>("sessions");
    this.weddings = database.collection<WeddingDocument>("weddings");
    this.members = database.collection<WeddingMemberDocument>("weddingMembers");
    this.invitations = database.collection<OrganizerInvitationDocument>("organizerInvitations");
  }

  async listActiveMembers(weddingId: string) {
    if (!ObjectId.isValid(weddingId)) return [];
    const memberships = await this.members
      .find({ weddingId: new ObjectId(weddingId), status: "ACTIVE" })
      .sort({ joinedAt: 1 })
      .toArray();
    const users = await this.users
      .find({ _id: { $in: memberships.map((membership) => membership.userId) } })
      .toArray();
    const usersById = new Map(users.map((user) => [user._id.toHexString(), user]));

    return memberships.flatMap((membership) => {
      const user = usersById.get(membership.userId.toHexString());
      return user
        ? [{
            id: membership._id.toHexString(),
            userId: user._id.toHexString(),
            name: user.name,
            email: user.email,
            role: membership.role,
            joinedAt: membership.joinedAt,
          }]
        : [];
    });
  }

  async findWeddingById(weddingId: string) {
    if (!ObjectId.isValid(weddingId)) return null;
    const wedding = await this.weddings.findOne({
      _id: new ObjectId(weddingId),
      status: "ACTIVE",
    });
    return wedding ? mapWedding(wedding) : null;
  }

  async listPendingInvitations(weddingId: string, now: Date) {
    if (!ObjectId.isValid(weddingId)) return [];
    const invitations = await this.invitations
      .find({
        weddingId: new ObjectId(weddingId),
        status: "PENDING",
        expiresAt: { $gt: now },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return invitations.map((invitation) => {
      const mapped = mapInvitation(invitation);
      return {
        id: mapped.id,
        email: mapped.email,
        role: mapped.role,
        status: mapped.status,
        expiresAt: mapped.expiresAt,
        createdAt: mapped.createdAt,
      };
    });
  }

  async findActiveMemberByEmail(weddingId: string, emailNormalized: string) {
    if (!ObjectId.isValid(weddingId)) return null;
    const user = await this.users.findOne({ emailNormalized });
    if (!user) return null;
    const membership = await this.members.findOne({
      weddingId: new ObjectId(weddingId),
      userId: user._id,
      status: "ACTIVE",
    });
    return membership ? mapMembership(membership) : null;
  }

  async findActiveMembershipByUserId(userId: string) {
    if (!ObjectId.isValid(userId)) return null;
    const membership = await this.members.findOne({
      userId: new ObjectId(userId),
      status: "ACTIVE",
    });
    return membership ? mapMembership(membership) : null;
  }

  async findInvitationByIdForWedding(invitationId: string, weddingId: string) {
    if (!ObjectId.isValid(invitationId) || !ObjectId.isValid(weddingId)) return null;
    const invitation = await this.invitations.findOne({
      _id: new ObjectId(invitationId),
      weddingId: new ObjectId(weddingId),
    });
    return invitation ? mapInvitation(invitation) : null;
  }

  async findInvitationAccessByTokenHash(tokenHash: string, now: Date) {
    const invitation = await this.invitations.findOne({ tokenHash });
    if (!invitation) return null;

    if (invitation.status === "PENDING" && invitation.expiresAt && invitation.expiresAt <= now) {
      const expiration = await this.invitations.updateOne(
        {
          _id: invitation._id,
          status: "PENDING",
          tokenHash: invitation.tokenHash,
          expiresAt: invitation.expiresAt,
        },
        { $set: { status: "EXPIRED", updatedAt: now } },
      );
      if (expiration.modifiedCount !== 1) return null;
      invitation.status = "EXPIRED";
    }

    const [wedding, inviterMembership, invitedUser] = await Promise.all([
      this.weddings.findOne({ _id: invitation.weddingId, status: "ACTIVE" }),
      this.members.findOne({ _id: invitation.invitedByMembershipId }),
      this.users.findOne({ emailNormalized: invitation.emailNormalized }),
    ]);
    if (!wedding || !inviterMembership) return null;
    const inviter = await this.users.findOne({ _id: inviterMembership.userId });
    if (!inviter) return null;

    return {
      invitation: mapInvitation(invitation),
      wedding: mapWedding(wedding),
      inviter: { id: inviter._id.toHexString(), name: inviter.name },
      invitedUser: invitedUser ? mapUser(invitedUser) : null,
    };
  }

  async expirePendingInvitationForEmail(weddingId: string, emailNormalized: string, now: Date) {
    if (!ObjectId.isValid(weddingId)) return;
    await this.invitations.updateMany(
      {
        weddingId: new ObjectId(weddingId),
        emailNormalized,
        status: "PENDING",
        expiresAt: { $lte: now },
      },
      { $set: { status: "EXPIRED", updatedAt: now } },
    );
  }

  async createInvitation(input: CreateOrganizerInvitationRecord) {
    const document: OrganizerInvitationDocument = {
      weddingId: new ObjectId(input.weddingId),
      email: input.email,
      emailNormalized: input.emailNormalized,
      role: input.role,
      tokenHash: input.tokenHash,
      status: "PENDING",
      invitedByMembershipId: new ObjectId(input.invitedByMembershipId),
      expiresAt: input.expiresAt,
      acceptedAt: null,
      acceptedByUserId: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    try {
      const result = await this.invitations.insertOne(document);
      return mapInvitation({ _id: result.insertedId, ...document });
    } catch (error) {
      if (duplicateKey(error, "tokenHash") || duplicateKey(error, "emailNormalized")) {
        throw new PendingOrganizerInvitationError();
      }
      throw error;
    }
  }

  async revokeInvitation(invitationId: string, weddingId: string, now: Date) {
    if (!ObjectId.isValid(invitationId) || !ObjectId.isValid(weddingId)) return false;
    const result = await this.invitations.updateOne(
      {
        _id: new ObjectId(invitationId),
        weddingId: new ObjectId(weddingId),
        status: "PENDING",
      },
      {
        $set: { status: "REVOKED", updatedAt: now },
        $unset: { expiresAt: "" },
      },
    );
    return result.modifiedCount === 1;
  }

  async rotateInvitation(input: RotateOrganizerInvitationRecord) {
    if (!ObjectId.isValid(input.invitationId) || !ObjectId.isValid(input.weddingId)) return null;
    const invitation = await this.invitations.findOneAndUpdate(
      {
        _id: new ObjectId(input.invitationId),
        weddingId: new ObjectId(input.weddingId),
        status: "PENDING",
      },
      {
        $set: {
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          updatedAt: input.updatedAt,
        },
      },
      { returnDocument: "after" },
    );
    return invitation ? mapInvitation(invitation) : null;
  }

  async acceptInvitation(input: AcceptOrganizerInvitationRecord) {
    const session = this.client.startSession();
    try {
      return await session.withTransaction(async () => {
        const invitation = await this.invitations.findOne(
          {
            _id: new ObjectId(input.invitationId),
            tokenHash: input.tokenHash,
            status: "PENDING",
            expiresAt: { $gt: input.now },
          },
          { session },
        );
        if (!invitation) throw new OrganizerInvitationUnavailableError();

        let user: WithId<UserDocument>;
        if (input.existingUserId) {
          const existing = await this.users.findOne(
            {
              _id: new ObjectId(input.existingUserId),
              emailNormalized: invitation.emailNormalized,
              status: "ACTIVE",
            },
            { session },
          );
          if (!existing) throw new OrganizerInvitationAccountExistsError();
          user = existing;
        } else {
          if (!input.newUser || !input.newSession) {
            throw new OrganizerInvitationUnavailableError();
          }
          const existing = await this.users.findOne(
            { emailNormalized: invitation.emailNormalized },
            { session, projection: { _id: 1 } },
          );
          if (existing) throw new OrganizerInvitationAccountExistsError();
          const userId = new ObjectId();
          user = {
            _id: userId,
            name: input.newUser.name,
            email: input.newUser.email,
            emailNormalized: input.newUser.emailNormalized,
            passwordHash: input.newUser.passwordHash,
            status: "ACTIVE",
            createdAt: input.now,
            updatedAt: input.now,
          };
          await this.users.insertOne({ ...user, _id: userId }, { session });
        }

        const activeMembership = await this.members.findOne(
          { userId: user._id, status: "ACTIVE" },
          { session, projection: { _id: 1 } },
        );
        if (activeMembership) throw new OrganizerInvitationActiveMembershipError();

        const membershipId = new ObjectId();
        const membershipDocument: WeddingMemberDocument = {
          weddingId: invitation.weddingId,
          userId: user._id,
          role: invitation.role,
          status: "ACTIVE",
          joinedAt: input.now,
          removedAt: null,
          createdAt: input.now,
          updatedAt: input.now,
        };
        await this.members.insertOne(
          { _id: membershipId, ...membershipDocument },
          { session },
        );

        if (input.newSession) {
          await this.sessions.insertOne(
            {
              userId: user._id,
              tokenHash: input.newSession.tokenHash,
              expiresAt: input.newSession.expiresAt,
              createdAt: input.now,
              lastSeenAt: input.now,
            },
            { session },
          );
        }

        const accepted = await this.invitations.findOneAndUpdate(
          { _id: invitation._id, status: "PENDING" },
          {
            $set: {
              status: "ACCEPTED",
              acceptedAt: input.now,
              acceptedByUserId: user._id,
              updatedAt: input.now,
            },
            $unset: { expiresAt: "" },
          },
          { session, returnDocument: "after" },
        );
        if (!accepted) throw new OrganizerInvitationUnavailableError();

        return {
          invitation: mapInvitation(accepted),
          membership: mapMembership({ _id: membershipId, ...membershipDocument }),
          user: mapUser(user),
        };
      });
    } catch (error) {
      if (duplicateKey(error, "emailNormalized")) {
        throw new OrganizerInvitationAccountExistsError();
      }
      if (duplicateKey(error, "userId")) {
        throw new OrganizerInvitationActiveMembershipError();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export async function ensureOrganizerIndexes(database: Db) {
  const invitations = database.collection<OrganizerInvitationDocument>("organizerInvitations");
  await Promise.all([
    invitations.createIndex(
      { tokenHash: 1 },
      { unique: true, name: "uniq_organizer_invitations_token_hash" },
    ),
    invitations.createIndex(
      { weddingId: 1, emailNormalized: 1, status: 1 },
      { name: "idx_organizer_invitations_wedding_email_status" },
    ),
    invitations.createIndex(
      { weddingId: 1, emailNormalized: 1 },
      {
        unique: true,
        name: "uniq_organizer_invitations_pending_email",
        partialFilterExpression: { status: "PENDING" },
      },
    ),
    invitations.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "ttl_organizer_invitations_expires_at" },
    ),
  ]);
}
