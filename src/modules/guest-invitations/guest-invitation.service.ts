import "server-only";

import { randomBytes } from "node:crypto";
import type { CreateInvitationCampaignInput } from "@/modules/guest-invitations/guest-invitation.schemas";
import {
  GuestInvitationCampaignValidationError,
  PendingGuestInvitationCampaignError,
  type GuestInvitationRepository,
} from "@/modules/guest-invitations/guest-invitation.repository";
import type { InvitationListQuery } from "@/modules/guest-invitations/guest-invitation.types";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import type { GuestInvitationMailer } from "@/server/providers/resend/guest-invitation-mailer";
import { conflictError, notFoundError, validationError } from "@/server/http/errors";

type Dependencies = {
  repository: GuestInvitationRepository;
  mailer: GuestInvitationMailer;
  now?: () => Date;
  batchSize?: number;
  invitationKey?: () => string;
};

export class GuestInvitationService {
  private readonly now: () => Date;
  private readonly batchSize: number;
  private readonly invitationKey: () => string;

  constructor(
    private readonly dependencies: Dependencies,
  ) {
    this.now = dependencies.now ?? (() => new Date());
    this.batchSize = Math.min(Math.max(dependencies.batchSize ?? 25, 1), 100);
    this.invitationKey =
      dependencies.invitationKey ??
      (() => randomBytes(32).toString("base64url"));
  }

  listHub(membership: OrganizerMembershipContext, query: InvitationListQuery) {
    return this.dependencies.repository.listHub(membership.weddingId, query);
  }

  async createCampaign(
    membership: OrganizerMembershipContext,
    input: CreateInvitationCampaignInput,
  ) {
    try {
      return await this.dependencies.repository.createCampaign({
        ...input,
        weddingId: membership.weddingId,
        createdByMembershipId: membership.id,
        createdAt: this.now(),
      });
    } catch (error) {
      if (error instanceof PendingGuestInvitationCampaignError) {
        throw conflictError(error.message);
      }
      if (error instanceof GuestInvitationCampaignValidationError) {
        throw validationError(error.message, {
          fieldErrors: { guestIds: [error.message] },
        });
      }
      throw error;
    }
  }

  async getCampaign(membership: OrganizerMembershipContext, campaignId: string) {
    const campaign = await this.dependencies.repository.getCampaign(
      membership.weddingId,
      campaignId,
    );
    if (!campaign) throw notFoundError("Invitation campaign not found.");
    return campaign;
  }

  async listRecipients(
    membership: OrganizerMembershipContext,
    campaignId: string,
    options?: { status?: "PENDING" | "SENT" | "FAILED"; page?: number; pageSize?: number },
  ) {
    await this.getCampaign(membership, campaignId);
    return this.dependencies.repository.listCampaignRecipients(
      membership.weddingId,
      campaignId,
      options,
    );
  }

  async sendNext(
    membership: OrganizerMembershipContext,
    campaignId: string,
  ) {
    const campaign = await this.getCampaign(membership, campaignId);
    if (["COMPLETED", "FAILED"].includes(campaign.status) && !campaign.pending) {
      return { campaign, processed: 0 };
    }
    const now = this.now();
    const marked = await this.dependencies.repository.markCampaignSending(
      membership.weddingId,
      campaignId,
      now,
    );
    if (!marked) throw conflictError("This invitation campaign can no longer be sent.");
    const contexts = await this.dependencies.repository.getPendingEmailContexts(
      membership.weddingId,
      campaignId,
      this.batchSize,
    );
    const results = contexts.length
      ? await this.dependencies.mailer.sendBatch(contexts)
      : [];
    const progress = await this.dependencies.repository.recordDeliveryResults(
      membership.weddingId,
      campaignId,
      results,
      this.now(),
    );
    if (!progress) throw notFoundError("Invitation campaign not found.");
    return { campaign: progress, processed: results.length };
  }

  async retryFailed(
    membership: OrganizerMembershipContext,
    campaignId: string,
  ) {
    await this.getCampaign(membership, campaignId);
    const campaign = await this.dependencies.repository.createRetryCampaign(
      membership.weddingId,
      campaignId,
      membership.id,
      this.now(),
    );
    if (!campaign) throw conflictError("No failed recipients are currently eligible for retry.");
    return campaign;
  }

  async revoke(membership: OrganizerMembershipContext, guestId: string) {
    const revoked = await this.dependencies.repository.revokeInvitation(
      membership.weddingId,
      guestId,
      this.now(),
    );
    if (!revoked) throw notFoundError("Active guest invitation not found.");
  }

  async restore(membership: OrganizerMembershipContext, guestId: string) {
    const restored = await this.dependencies.repository.restoreInvitation(
      membership.weddingId,
      guestId,
      this.invitationKey(),
      this.now(),
    );
    if (!restored) throw notFoundError("Revoked guest invitation not found.");
  }

  async updateEmail(
    membership: OrganizerMembershipContext,
    guestId: string,
    email: string,
  ) {
    const updated = await this.dependencies.repository.updateGuestEmail(
      membership.weddingId,
      guestId,
      email,
      this.now(),
    );
    if (!updated) throw notFoundError("Wedding guest not found.");
  }

  async resolveAccess(accessKey: string) {
    const context = await this.dependencies.repository.resolveActiveAccess(accessKey);
    if (!context) throw notFoundError("This wedding invitation is unavailable.");
    return context;
  }
}
