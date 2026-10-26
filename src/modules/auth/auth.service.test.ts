import { describe, expect, it } from "vitest";
import {
  DuplicateOrganizerEmailError,
  type AuthRepository,
  type CreateOrganizerSessionRecord,
  type CreateOrganizerUserRecord,
} from "@/modules/auth/auth.repository";
import { AuthService, ORGANIZER_SESSION_DURATION_SECONDS } from "@/modules/auth/auth.service";
import type { OrganizerSession, OrganizerUser } from "@/modules/auth/auth.types";
import { hashPassword } from "@/server/security/password";
import { hashSessionToken } from "@/server/security/session-token";

class FakeAuthRepository implements AuthRepository {
  users: OrganizerUser[] = [];
  sessions: OrganizerSession[] = [];

  async findUserByEmailNormalized(emailNormalized: string) {
    return this.users.find((user) => user.emailNormalized === emailNormalized) ?? null;
  }

  async findUserById(userId: string) {
    return this.users.find((user) => user.id === userId) ?? null;
  }

  async createUser(input: CreateOrganizerUserRecord) {
    if (await this.findUserByEmailNormalized(input.emailNormalized)) {
      throw new DuplicateOrganizerEmailError();
    }

    const user: OrganizerUser = {
      id: `user-${this.users.length + 1}`,
      ...input,
      status: "ACTIVE",
      updatedAt: input.createdAt,
    };
    this.users.push(user);
    return user;
  }

  async createSession(input: CreateOrganizerSessionRecord) {
    const session: OrganizerSession = {
      id: `session-${this.sessions.length + 1}`,
      ...input,
      lastSeenAt: input.createdAt,
    };
    this.sessions.push(session);
    return session;
  }

  async findActiveSessionByTokenHash(tokenHash: string, now: Date) {
    return (
      this.sessions.find(
        (session) => session.tokenHash === tokenHash && session.expiresAt > now,
      ) ?? null
    );
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    this.sessions = this.sessions.filter((session) => session.tokenHash !== tokenHash);
  }
}

const now = new Date("2026-10-26T10:00:00.000Z");

async function addUser(repository: FakeAuthRepository, password = "a valid organizer passphrase") {
  const passwordHash = await hashPassword(password);
  const user: OrganizerUser = {
    id: "user-1",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    emailNormalized: "rahul@example.com",
    passwordHash,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
  repository.users.push(user);
  return user;
}

describe("AuthService", () => {
  it("registers an organizer with an Argon2id password hash", async () => {
    const repository = new FakeAuthRepository();
    const service = new AuthService({ repository, now: () => now });

    const user = await service.register({
      name: "Rahul Sharma",
      email: "rahul@example.com",
      password: "a valid organizer passphrase",
    });

    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
    expect(user.passwordHash).not.toContain("a valid organizer passphrase");
  });

  it("returns a conflict for an existing organizer email", async () => {
    const repository = new FakeAuthRepository();
    await addUser(repository);
    const service = new AuthService({ repository, now: () => now });

    await expect(
      service.register({
        name: "Another Rahul",
        email: "rahul@example.com",
        password: "another valid organizer passphrase",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("creates a seven-day session while storing only the token hash", async () => {
    const repository = new FakeAuthRepository();
    await addUser(repository);
    const service = new AuthService({ repository, now: () => now });

    const result = await service.login({
      email: "rahul@example.com",
      password: "a valid organizer passphrase",
    });

    expect(result.rawToken).toHaveLength(43);
    expect(repository.sessions[0]?.tokenHash).toBe(hashSessionToken(result.rawToken));
    expect(repository.sessions[0]?.tokenHash).not.toBe(result.rawToken);
    expect(result.expiresAt.getTime() - now.getTime()).toBe(
      ORGANIZER_SESSION_DURATION_SECONDS * 1_000,
    );
  });

  it("uses the same safe error for unknown emails and incorrect passwords", async () => {
    const repository = new FakeAuthRepository();
    await addUser(repository);
    const service = new AuthService({ repository, now: () => now });

    const attempts = [
      { email: "unknown@example.com", password: "incorrect password" },
      { email: "rahul@example.com", password: "incorrect password" },
    ];

    for (const attempt of attempts) {
      await expect(service.login(attempt)).rejects.toEqual(
        expect.objectContaining({
          code: "UNAUTHENTICATED",
          status: 401,
          message: "Incorrect email address or password.",
        }),
      );
    }
  });

  it("authenticates and then revokes an organizer session", async () => {
    const repository = new FakeAuthRepository();
    const user = await addUser(repository);
    const service = new AuthService({ repository, now: () => now });
    const login = await service.login({
      email: user.email,
      password: "a valid organizer passphrase",
    });

    await expect(service.authenticate(login.rawToken)).resolves.toMatchObject({
      user: { id: user.id, email: user.email },
      membership: null,
    });

    await service.logout(login.rawToken);

    await expect(service.authenticate(login.rawToken)).resolves.toBeNull();
  });
});
