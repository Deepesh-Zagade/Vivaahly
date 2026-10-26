import "server-only";

import {
  DuplicateOrganizerEmailError,
  type AuthRepository,
} from "@/modules/auth/auth.repository";
import type {
  LoginOrganizerInput,
  RegisterOrganizerInput,
} from "@/modules/auth/auth.schemas";
import type { AuthenticatedOrganizer } from "@/modules/auth/auth.types";
import { conflictError, unauthenticatedError } from "@/server/http/errors";
import {
  hashPassword,
  INVALID_LOGIN_PASSWORD_HASH,
  verifyPassword,
} from "@/server/security/password";
import { createSessionToken, hashSessionToken } from "@/server/security/session-token";

export const ORGANIZER_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type AuthServiceDependencies = {
  repository: AuthRepository;
  now?: () => Date;
};

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly now: () => Date;

  constructor({ repository, now = () => new Date() }: AuthServiceDependencies) {
    this.repository = repository;
    this.now = now;
  }

  async register(input: RegisterOrganizerInput) {
    const existingUser = await this.repository.findUserByEmailNormalized(input.email);

    if (existingUser) {
      throw conflictError("An account with this email address already exists.");
    }

    const createdAt = this.now();
    const passwordHash = await hashPassword(input.password);

    try {
      return await this.repository.createUser({
        name: input.name,
        email: input.email,
        emailNormalized: input.email,
        passwordHash,
        createdAt,
      });
    } catch (error) {
      if (error instanceof DuplicateOrganizerEmailError) {
        throw conflictError("An account with this email address already exists.");
      }

      throw error;
    }
  }

  async login(input: LoginOrganizerInput) {
    const user = await this.repository.findUserByEmailNormalized(input.email);
    const passwordMatches = await verifyPassword(
      user?.passwordHash ?? INVALID_LOGIN_PASSWORD_HASH,
      input.password,
    );

    if (!user || user.status !== "ACTIVE" || !passwordMatches) {
      throw unauthenticatedError("Incorrect email address or password.");
    }

    const createdAt = this.now();
    const expiresAt = new Date(
      createdAt.getTime() + ORGANIZER_SESSION_DURATION_SECONDS * 1_000,
    );
    const { rawToken, tokenHash } = createSessionToken();

    await this.repository.createSession({
      userId: user.id,
      tokenHash,
      expiresAt,
      createdAt,
    });

    return { user, rawToken, expiresAt };
  }

  async authenticate(rawToken: string): Promise<AuthenticatedOrganizer | null> {
    const session = await this.repository.findActiveSessionByTokenHash(
      hashSessionToken(rawToken),
      this.now(),
    );

    if (!session) return null;

    const user = await this.repository.findUserById(session.userId);

    if (!user || user.status !== "ACTIVE") return null;

    return { user, membership: null };
  }

  async logout(rawToken: string) {
    await this.repository.deleteSessionByTokenHash(hashSessionToken(rawToken));
  }
}
