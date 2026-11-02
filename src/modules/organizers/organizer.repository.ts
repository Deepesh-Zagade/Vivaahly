import type { OrganizerSession, OrganizerUser } from "@/modules/auth/auth.types";
import type {
  OrganizerInvitation,
  OrganizerInvitationAccessRecord,
  OrganizerInvitationSummary,
  OrganizerMemberSummary,
  AcceptedOrganizerInvitation,
} from "@/modules/organizers/organizer.types";
import type { WeddingMemberRole, WeddingMembership } from "@/modules/wedding/wedding.types";
import type { Wedding } from "@/modules/wedding/wedding.types";

export class PendingOrganizerInvitationError extends Error {}
export class OrganizerInvitationUnavailableError extends Error {}
export class OrganizerInvitationAccountExistsError extends Error {}
export class OrganizerInvitationActiveMembershipError extends Error {}
export class FinalOrganizerAdminError extends Error {}
export class SelfOrganizerManagementError extends Error {}

export type CreateOrganizerInvitationRecord = {
  weddingId: string;
  email: string;
  emailNormalized: string;
  role: WeddingMemberRole;
  tokenHash: string;
  invitedByMembershipId: string;
  expiresAt: Date;
  createdAt: Date;
};

export type RotateOrganizerInvitationRecord = {
  invitationId: string;
  weddingId: string;
  tokenHash: string;
  expiresAt: Date;
  updatedAt: Date;
};

export type AcceptOrganizerInvitationRecord = {
  invitationId: string;
  tokenHash: string;
  now: Date;
  existingUserId?: string;
  newUser?: {
    name: string;
    email: string;
    emailNormalized: string;
    passwordHash: string;
  };
  newSession?: {
    tokenHash: string;
    expiresAt: Date;
  };
};

export type UpdateOrganizerMemberRoleRecord = {
  weddingId: string;
  actorMemberId: string;
  memberId: string;
  role: WeddingMemberRole;
  updatedAt: Date;
};

export type RemoveOrganizerMemberRecord = {
  weddingId: string;
  actorMemberId: string;
  memberId: string;
  removedAt: Date;
};

export interface OrganizerRepository {
  findWeddingById(weddingId: string): Promise<Wedding | null>;
  listActiveMembers(weddingId: string): Promise<OrganizerMemberSummary[]>;
  listPendingInvitations(weddingId: string, now: Date): Promise<OrganizerInvitationSummary[]>;
  findActiveMemberByEmail(weddingId: string, emailNormalized: string): Promise<WeddingMembership | null>;
  findActiveMembershipByUserId(userId: string): Promise<WeddingMembership | null>;
  findInvitationByIdForWedding(invitationId: string, weddingId: string): Promise<OrganizerInvitation | null>;
  findInvitationAccessByTokenHash(tokenHash: string, now: Date): Promise<OrganizerInvitationAccessRecord | null>;
  expirePendingInvitationForEmail(weddingId: string, emailNormalized: string, now: Date): Promise<void>;
  createInvitation(input: CreateOrganizerInvitationRecord): Promise<OrganizerInvitation>;
  revokeInvitation(invitationId: string, weddingId: string, now: Date): Promise<boolean>;
  rotateInvitation(input: RotateOrganizerInvitationRecord): Promise<OrganizerInvitation | null>;
  updateMemberRole(input: UpdateOrganizerMemberRoleRecord): Promise<WeddingMembership | null>;
  removeMember(input: RemoveOrganizerMemberRecord): Promise<WeddingMembership | null>;
  acceptInvitation(input: AcceptOrganizerInvitationRecord): Promise<AcceptedOrganizerInvitation>;
}

export type CreatedOrganizerSession = Pick<OrganizerSession, "expiresAt"> & {
  rawToken: string;
};

export type OrganizerInvitationMailer = {
  sendInvitation(input: {
    invitationId: string;
    deliveryAttempt: string;
    recipientEmail: string;
    inviterName: string;
    weddingTitle: string;
    coupleName: string;
    role: WeddingMemberRole;
    invitationUrl: string;
    expiresAt: Date;
  }): Promise<void>;
};

export type CurrentOrganizerForInvitation = {
  user: Pick<OrganizerUser, "id" | "name" | "email" | "emailNormalized">;
  membership: { id: string; weddingId: string; role: WeddingMemberRole } | null;
};
