import type { CreateInvitationCampaignInput } from "@/modules/guest-invitations/guest-invitation.schemas";
import type {
  CampaignRecipient,
  EmailCampaignStatus,
  InvitationAccessContext,
  InvitationCampaignProgress,
  InvitationEmailContext,
  InvitationHubResult,
  InvitationListQuery,
} from "@/modules/guest-invitations/guest-invitation.types";

export class GuestInvitationCampaignValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuestInvitationCampaignValidationError";
  }
}

export class PendingGuestInvitationCampaignError extends Error {
  constructor() {
    super("One or more selected guests already has a pending invitation send.");
    this.name = "PendingGuestInvitationCampaignError";
  }
}

export type CreateCampaignRecord = CreateInvitationCampaignInput & {
  weddingId: string;
  createdByMembershipId: string;
  createdAt: Date;
};

export type DeliveryResult = {
  recipientId: string;
  sent: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
};

export interface GuestInvitationRepository {
  listHub(weddingId: string, query: InvitationListQuery): Promise<InvitationHubResult>;
  createCampaign(input: CreateCampaignRecord): Promise<InvitationCampaignProgress>;
  getCampaign(weddingId: string, campaignId: string): Promise<InvitationCampaignProgress | null>;
  listCampaignRecipients(
    weddingId: string,
    campaignId: string,
    options?: { status?: "PENDING" | "SENT" | "FAILED"; page?: number; pageSize?: number },
  ): Promise<{ recipients: CampaignRecipient[]; total: number }>;
  getPendingEmailContexts(
    weddingId: string,
    campaignId: string,
    limit: number,
  ): Promise<InvitationEmailContext[]>;
  markCampaignSending(weddingId: string, campaignId: string, now: Date): Promise<boolean>;
  recordDeliveryResults(
    weddingId: string,
    campaignId: string,
    results: DeliveryResult[],
    now: Date,
  ): Promise<InvitationCampaignProgress | null>;
  createRetryCampaign(
    weddingId: string,
    campaignId: string,
    createdByMembershipId: string,
    now: Date,
  ): Promise<InvitationCampaignProgress | null>;
  revokeInvitation(weddingId: string, guestId: string, now: Date): Promise<boolean>;
  restoreInvitation(
    weddingId: string,
    guestId: string,
    accessKey: string,
    now: Date,
  ): Promise<boolean>;
  updateGuestEmail(weddingId: string, guestId: string, email: string, now: Date): Promise<boolean>;
  resolveActiveAccess(accessKey: string): Promise<InvitationAccessContext | null>;
  updateCampaignStatus(
    weddingId: string,
    campaignId: string,
    status: EmailCampaignStatus,
    now: Date,
  ): Promise<InvitationCampaignProgress | null>;
}
