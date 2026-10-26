import type { OrganizerSession, OrganizerUser } from "@/modules/auth/auth.types";

export class DuplicateOrganizerEmailError extends Error {
  constructor() {
    super("An organizer with this email address already exists.");
    this.name = "DuplicateOrganizerEmailError";
  }
}

export type CreateOrganizerUserRecord = {
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  createdAt: Date;
};

export type CreateOrganizerSessionRecord = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export interface AuthRepository {
  findUserByEmailNormalized(emailNormalized: string): Promise<OrganizerUser | null>;
  findUserById(userId: string): Promise<OrganizerUser | null>;
  createUser(input: CreateOrganizerUserRecord): Promise<OrganizerUser>;
  createSession(input: CreateOrganizerSessionRecord): Promise<OrganizerSession>;
  findActiveSessionByTokenHash(tokenHash: string, now: Date): Promise<OrganizerSession | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
}
