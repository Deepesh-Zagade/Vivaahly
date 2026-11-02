import type { OrganizerUser } from "@/modules/auth/auth.types";
import type {
  Wedding,
  WeddingMemberRole,
  WeddingMembership,
} from "@/modules/wedding/wedding.types";

export type OrganizerInvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REVOKED"
  | "EXPIRED";

export type OrganizerInvitation = {
  id: string;
  weddingId: string;
  email: string;
  emailNormalized: string;
  role: WeddingMemberRole;
  tokenHash: string;
  status: OrganizerInvitationStatus;
  invitedByMembershipId: string;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  acceptedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizerMemberSummary = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WeddingMemberRole;
  joinedAt: Date;
};

export type OrganizerInvitationSummary = Pick<
  OrganizerInvitation,
  "id" | "email" | "role" | "status" | "expiresAt" | "createdAt"
>;

export type OrganizerInvitationAccessRecord = {
  invitation: OrganizerInvitation;
  wedding: Wedding;
  inviter: Pick<OrganizerUser, "id" | "name">;
  invitedUser: OrganizerUser | null;
};

export type AcceptedOrganizerInvitation = {
  invitation: OrganizerInvitation;
  membership: WeddingMembership;
  user: OrganizerUser;
};

export type OrganizerInvitationAccessState =
  | "NEW_USER"
  | "SIGN_IN_REQUIRED"
  | "READY"
  | "WRONG_ACCOUNT"
  | "ACTIVE_MEMBERSHIP_CONFLICT"
  | "UNAVAILABLE";

export type OrganizerInvitationAccessDto = {
  state: OrganizerInvitationAccessState;
  invitation: null | {
    weddingTitle: string;
    coupleName: string;
    weddingDate: string;
    weddingLocation: string;
    role: WeddingMemberRole;
    expiresAt: string;
    inviterName: string;
    invitedEmailMasked: string;
    signedInEmail?: string;
    signedInName?: string;
  };
};
