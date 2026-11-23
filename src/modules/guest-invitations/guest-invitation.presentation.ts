import type {
  CampaignRecipient,
  InvitationCampaignProgress,
} from "@/modules/guest-invitations/guest-invitation.types";

export function mapCampaignDto(campaign: InvitationCampaignProgress) {
  return {
    ...campaign,
    startedAt: campaign.startedAt?.toISOString() ?? null,
    completedAt: campaign.completedAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export function mapCampaignRecipientDto(recipient: CampaignRecipient) {
  return {
    ...recipient,
    lastAttemptAt: recipient.lastAttemptAt?.toISOString() ?? null,
    sentAt: recipient.sentAt?.toISOString() ?? null,
  };
}
