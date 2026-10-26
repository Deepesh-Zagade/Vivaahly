import "server-only";

import {
  MongoServerError,
  ObjectId,
  type Collection,
  type Db,
  type WithId,
} from "mongodb";
import {
  DuplicateOrganizerEmailError,
  type AuthRepository,
  type CreateOrganizerSessionRecord,
  type CreateOrganizerUserRecord,
} from "@/modules/auth/auth.repository";
import type { OrganizerSession, OrganizerUser } from "@/modules/auth/auth.types";

type UserDocument = {
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: Date;
  updatedAt: Date;
};

type SessionDocument = {
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastSeenAt: Date;
};

function mapUser(document: WithId<UserDocument>): OrganizerUser {
  return {
    id: document._id.toHexString(),
    name: document.name,
    email: document.email,
    emailNormalized: document.emailNormalized,
    passwordHash: document.passwordHash,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function mapSession(document: WithId<SessionDocument>): OrganizerSession {
  return {
    id: document._id.toHexString(),
    userId: document.userId.toHexString(),
    tokenHash: document.tokenHash,
    expiresAt: document.expiresAt,
    createdAt: document.createdAt,
    lastSeenAt: document.lastSeenAt,
  };
}

export class MongoAuthRepository implements AuthRepository {
  private readonly users: Collection<UserDocument>;
  private readonly sessions: Collection<SessionDocument>;

  constructor(database: Db) {
    this.users = database.collection<UserDocument>("users");
    this.sessions = database.collection<SessionDocument>("sessions");
  }

  async findUserByEmailNormalized(emailNormalized: string) {
    const user = await this.users.findOne({ emailNormalized });
    return user ? mapUser(user) : null;
  }

  async findUserById(userId: string) {
    if (!ObjectId.isValid(userId)) return null;

    const user = await this.users.findOne({ _id: new ObjectId(userId) });
    return user ? mapUser(user) : null;
  }

  async createUser(input: CreateOrganizerUserRecord) {
    const document: UserDocument = {
      name: input.name,
      email: input.email,
      emailNormalized: input.emailNormalized,
      passwordHash: input.passwordHash,
      status: "ACTIVE",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };

    try {
      const result = await this.users.insertOne(document);
      return mapUser({ _id: result.insertedId, ...document });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11_000) {
        throw new DuplicateOrganizerEmailError();
      }

      throw error;
    }
  }

  async createSession(input: CreateOrganizerSessionRecord) {
    const document: SessionDocument = {
      userId: new ObjectId(input.userId),
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: input.createdAt,
      lastSeenAt: input.createdAt,
    };
    const result = await this.sessions.insertOne(document);

    return mapSession({ _id: result.insertedId, ...document });
  }

  async findActiveSessionByTokenHash(tokenHash: string, now: Date) {
    const session = await this.sessions.findOne({
      tokenHash,
      expiresAt: { $gt: now },
    });

    return session ? mapSession(session) : null;
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    await this.sessions.deleteOne({ tokenHash });
  }
}

export async function ensureAuthIndexes(database: Db) {
  const users = database.collection<UserDocument>("users");
  const sessions = database.collection<SessionDocument>("sessions");

  await Promise.all([
    users.createIndex(
      { emailNormalized: 1 },
      { unique: true, name: "uniq_users_email_normalized" },
    ),
    sessions.createIndex(
      { tokenHash: 1 },
      { unique: true, name: "uniq_sessions_token_hash" },
    ),
    sessions.createIndex({ userId: 1 }, { name: "idx_sessions_user_id" }),
    sessions.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "ttl_sessions_expires_at" },
    ),
  ]);
}
