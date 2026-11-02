import "server-only";

import type { AuthenticatedOrganizer } from "@/modules/auth/auth.types";
import { ORGANIZER_SESSION_DURATION_SECONDS } from "@/modules/auth/auth.service";
import type {
  AcceptOrganizerInvitationInput,
  CreateOrganizerInvitationInput,
  UpdateOrganizerMemberInput,
} from "@/modules/organizers/organizer.schemas";
import {
  FinalOrganizerAdminError,
  OrganizerInvitationAccountExistsError,
  OrganizerInvitationActiveMembershipError,
  OrganizerInvitationUnavailableError,
  PendingOrganizerInvitationError,
  SelfOrganizerManagementError,
  type OrganizerInvitationMailer,
  type OrganizerRepository,
} from "@/modules/organizers/organizer.repository";
import {
  createOrganizerInvitationToken,
  hashOrganizerInvitationToken,
} from "@/modules/organizers/organizer-invitation-token";
import type {
  OrganizerInvitationAccessDto,
  OrganizerInvitationAccessRecord,
} from "@/modules/organizers/organizer.types";
import { coupleDisplayName } from "@/modules/wedding/wedding.presentation";
import {
  conflictError,
  forbiddenError,
  notFoundError,
  validationError,
} from "@/server/http/errors";
import { hashPassword } from "@/server/security/password";
import { createSessionToken } from "@/server/security/session-token";

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1_000;
const MONGO_OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

type OrganizerServiceDependencies = {
  repository: OrganizerRepository;
  mailer: OrganizerInvitationMailer;
  appBaseUrl: string | (() => string);
  now?: () => Date;
};

function assertAdmin(organizer: AuthenticatedOrganizer) {
  if (!organizer.membership) {
    throw conflictError("Create a wedding before managing organizers.");
  }
  if (organizer.membership.role !== "ADMIN") {
    throw forbiddenError("Only wedding Admins can manage organizers.");
  }
  return organizer.membership;
}

function rethrowMembershipError(error: unknown): never {
  if (error instanceof SelfOrganizerManagementError) {
    throw conflictError("You cannot manage your own organizer membership.", {
      reason: "SELF_MANAGEMENT_NOT_ALLOWED",
    });
  }
  if (error instanceof FinalOrganizerAdminError) {
    throw conflictError("Every wedding must retain at least one Admin.", {
      reason: "FINAL_ADMIN",
    });
  }
  throw error;
}

function canonicalMemberId(memberId: string) {
  return MONGO_OBJECT_ID_PATTERN.test(memberId) ? memberId.toLowerCase() : memberId;
}

function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

function invitationDto(
  record: OrganizerInvitationAccessRecord,
  organizer: AuthenticatedOrganizer | null,
  now: Date,
): OrganizerInvitationAccessDto {
  const invitation = record.invitation;
  if (
    invitation.status !== "PENDING" ||
    !invitation.expiresAt ||
    invitation.expiresAt <= now
  ) {
    return { state: "UNAVAILABLE", invitation: null };
  }

  let state: OrganizerInvitationAccessDto["state"];
  if (!organizer) {
    state = record.invitedUser ? "SIGN_IN_REQUIRED" : "NEW_USER";
  } else if (organizer.user.emailNormalized !== invitation.emailNormalized) {
    state = "WRONG_ACCOUNT";
  } else if (organizer.membership) {
    state = "ACTIVE_MEMBERSHIP_CONFLICT";
  } else {
    state = "READY";
  }

  return {
    state,
    invitation: {
      weddingTitle: record.wedding.title.en,
      coupleName: coupleDisplayName(
        record.wedding.couple.groom.name.en,
        record.wedding.couple.bride.name.en,
      ),
      weddingDate: record.wedding.mainWeddingDate.toISOString().slice(0, 10),
      weddingLocation: record.wedding.primaryVenue.city.en,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      inviterName: record.inviter.name,
      invitedEmailMasked: maskEmail(invitation.email),
      ...(organizer
        ? {
            signedInEmail: organizer.user.email,
            signedInName: organizer.user.name,
          }
        : {}),
    },
  };
}

export class OrganizerService {
  private readonly repository: OrganizerRepository;
  private readonly mailer: OrganizerInvitationMailer;
  private readonly getAppBaseUrl: () => string;
  private readonly now: () => Date;

  constructor({ repository, mailer, appBaseUrl, now = () => new Date() }: OrganizerServiceDependencies) {
    this.repository = repository;
    this.mailer = mailer;
    this.getAppBaseUrl =
      typeof appBaseUrl === "function"
        ? appBaseUrl
        : () => appBaseUrl.replace(/\/$/, "");
    this.now = now;
  }

  async getOrganizerManagement(organizer: AuthenticatedOrganizer) {
    if (!organizer.membership) {
      throw conflictError("Create a wedding before viewing organizers.");
    }
    const wedding = await this.repository.findWeddingById(organizer.membership.weddingId);
    if (!wedding) throw notFoundError("Wedding not found.");
    const members = await this.repository.listActiveMembers(wedding.id);
    const invitations = organizer.membership.role === "ADMIN"
      ? await this.repository.listPendingInvitations(wedding.id, this.now())
      : [];
    return {
      wedding,
      members,
      invitations,
      canManage: organizer.membership.role === "ADMIN",
    };
  }

  async createInvitation(
    organizer: AuthenticatedOrganizer,
    input: CreateOrganizerInvitationInput,
  ) {
    const membership = assertAdmin(organizer);
    const now = this.now();
    const wedding = await this.repository.findWeddingById(membership.weddingId);
    if (!wedding) throw notFoundError("Wedding not found.");
    const appBaseUrl = this.getAppBaseUrl();

    if (await this.repository.findActiveMemberByEmail(wedding.id, input.email)) {
      throw conflictError("This person is already part of the wedding workspace.");
    }
    await this.repository.expirePendingInvitationForEmail(wedding.id, input.email, now);
    const { rawToken, tokenHash } = createOrganizerInvitationToken();
    const expiresAt = new Date(now.getTime() + INVITATION_DURATION_MS);

    try {
      const invitation = await this.repository.createInvitation({
        weddingId: wedding.id,
        email: input.email,
        emailNormalized: input.email,
        role: input.role,
        tokenHash,
        invitedByMembershipId: membership.id,
        expiresAt,
        createdAt: now,
      });
      await this.mailer.sendInvitation({
        invitationId: invitation.id,
        deliveryAttempt: invitation.createdAt.getTime().toString(),
        recipientEmail: invitation.email,
        inviterName: organizer.user.name,
        weddingTitle: wedding.title.en,
        coupleName: coupleDisplayName(
          wedding.couple.groom.name.en,
          wedding.couple.bride.name.en,
        ),
        role: invitation.role,
        invitationUrl: `${appBaseUrl}/join/${rawToken}`,
        expiresAt,
      });
      return invitation;
    } catch (error) {
      if (error instanceof PendingOrganizerInvitationError) {
        throw conflictError("A pending invitation already exists for this email address.");
      }
      throw error;
    }
  }

  async revokeInvitation(organizer: AuthenticatedOrganizer, invitationId: string) {
    const membership = assertAdmin(organizer);
    const revoked = await this.repository.revokeInvitation(
      invitationId,
      membership.weddingId,
      this.now(),
    );
    if (!revoked) throw notFoundError("Pending invitation not found.");
  }

  async resendInvitation(organizer: AuthenticatedOrganizer, invitationId: string) {
    const membership = assertAdmin(organizer);
    const existing = await this.repository.findInvitationByIdForWedding(
      invitationId,
      membership.weddingId,
    );
    if (!existing || existing.status !== "PENDING") {
      throw notFoundError("Pending invitation not found.");
    }
    const wedding = await this.repository.findWeddingById(membership.weddingId);
    if (!wedding) throw notFoundError("Wedding not found.");
    const appBaseUrl = this.getAppBaseUrl();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + INVITATION_DURATION_MS);
    const { rawToken, tokenHash } = createOrganizerInvitationToken();
    const invitation = await this.repository.rotateInvitation({
      invitationId,
      weddingId: membership.weddingId,
      tokenHash,
      expiresAt,
      updatedAt: now,
    });
    if (!invitation) throw notFoundError("Pending invitation not found.");
    await this.mailer.sendInvitation({
      invitationId,
      deliveryAttempt: now.getTime().toString(),
      recipientEmail: invitation.email,
      inviterName: organizer.user.name,
      weddingTitle: wedding.title.en,
      coupleName: coupleDisplayName(
        wedding.couple.groom.name.en,
        wedding.couple.bride.name.en,
      ),
      role: invitation.role,
      invitationUrl: `${appBaseUrl}/join/${rawToken}`,
      expiresAt,
    });
    return invitation;
  }

  async updateMemberRole(
    organizer: AuthenticatedOrganizer,
    memberId: string,
    input: UpdateOrganizerMemberInput,
  ) {
    const membership = assertAdmin(organizer);
    const targetMemberId = canonicalMemberId(memberId);
    if (targetMemberId === canonicalMemberId(membership.id)) {
      throw conflictError("You cannot change your own organizer role.", {
        reason: "SELF_MANAGEMENT_NOT_ALLOWED",
      });
    }
    try {
      const updated = await this.repository.updateMemberRole({
        weddingId: membership.weddingId,
        actorMemberId: membership.id,
        memberId: targetMemberId,
        role: input.role,
        updatedAt: this.now(),
      });
      if (!updated) throw notFoundError("Active organizer not found.");
      return updated;
    } catch (error) {
      rethrowMembershipError(error);
    }
  }

  async removeMember(organizer: AuthenticatedOrganizer, memberId: string) {
    const membership = assertAdmin(organizer);
    const targetMemberId = canonicalMemberId(memberId);
    if (targetMemberId === canonicalMemberId(membership.id)) {
      throw conflictError("You cannot remove yourself from the wedding workspace.", {
        reason: "SELF_MANAGEMENT_NOT_ALLOWED",
      });
    }
    try {
      const removed = await this.repository.removeMember({
        weddingId: membership.weddingId,
        actorMemberId: membership.id,
        memberId: targetMemberId,
        removedAt: this.now(),
      });
      if (!removed) throw notFoundError("Active organizer not found.");
      return removed;
    } catch (error) {
      rethrowMembershipError(error);
    }
  }

  async getInvitationAccess(rawToken: string, organizer: AuthenticatedOrganizer | null) {
    const record = await this.repository.findInvitationAccessByTokenHash(
      hashOrganizerInvitationToken(rawToken),
      this.now(),
    );
    return record ? invitationDto(record, organizer, this.now()) : { state: "UNAVAILABLE" as const, invitation: null };
  }

  async acceptInvitation(
    rawToken: string,
    organizer: AuthenticatedOrganizer | null,
    input: AcceptOrganizerInvitationInput,
  ) {
    const now = this.now();
    const tokenHash = hashOrganizerInvitationToken(rawToken);
    const record = await this.repository.findInvitationAccessByTokenHash(tokenHash, now);
    if (!record || record.invitation.status !== "PENDING" || !record.invitation.expiresAt) {
      throw conflictError("This invitation is no longer available.", { reason: "INVITATION_UNAVAILABLE" });
    }

    if (organizer) {
      if (organizer.user.emailNormalized !== record.invitation.emailNormalized) {
        throw conflictError("Sign in using the email address that received this invitation.", {
          reason: "ACCOUNT_MISMATCH",
        });
      }
      if (organizer.membership) {
        throw conflictError("Your account already belongs to an active wedding workspace.", {
          reason: "ACTIVE_MEMBERSHIP",
        });
      }
      try {
        return {
          result: await this.repository.acceptInvitation({
            invitationId: record.invitation.id,
            tokenHash,
            now,
            existingUserId: organizer.user.id,
          }),
          session: null,
        };
      } catch (error) {
        this.rethrowAcceptanceError(error);
      }
    }

    if (record.invitedUser) {
      throw conflictError("Sign in using the email address that received this invitation.", {
        reason: "SIGN_IN_REQUIRED",
      });
    }
    if (!input.name || !input.password) {
      throw validationError("Create your account to accept this invitation.", {
        fieldErrors: {
          ...(!input.name ? { name: ["Enter your full name."] } : {}),
          ...(!input.password ? { password: ["Enter a password."] } : {}),
        },
      });
    }

    const passwordHash = await hashPassword(input.password);
    const { rawToken: sessionRawToken, tokenHash: sessionTokenHash } = createSessionToken();
    const sessionExpiresAt = new Date(
      now.getTime() + ORGANIZER_SESSION_DURATION_SECONDS * 1_000,
    );
    try {
      return {
        result: await this.repository.acceptInvitation({
          invitationId: record.invitation.id,
          tokenHash,
          now,
          newUser: {
            name: input.name,
            email: record.invitation.email,
            emailNormalized: record.invitation.emailNormalized,
            passwordHash,
          },
          newSession: { tokenHash: sessionTokenHash, expiresAt: sessionExpiresAt },
        }),
        session: { rawToken: sessionRawToken, expiresAt: sessionExpiresAt },
      };
    } catch (error) {
      this.rethrowAcceptanceError(error);
    }
  }

  private rethrowAcceptanceError(error: unknown): never {
    if (error instanceof OrganizerInvitationUnavailableError) {
      throw conflictError("This invitation is no longer available.", { reason: "INVITATION_UNAVAILABLE" });
    }
    if (error instanceof OrganizerInvitationAccountExistsError) {
      throw conflictError("An account now exists for this invitation email. Sign in to continue.", {
        reason: "SIGN_IN_REQUIRED",
      });
    }
    if (error instanceof OrganizerInvitationActiveMembershipError) {
      throw conflictError("Your account already belongs to an active wedding workspace.", {
        reason: "ACTIVE_MEMBERSHIP",
      });
    }
    throw error;
  }
}
