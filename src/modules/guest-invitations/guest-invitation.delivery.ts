export type PendingCampaignRecipientReference = {
  recipientId: string;
  guestId: string;
  invitationId: string;
};

export type CampaignRecipientEligibility = {
  sendableRecipientIds: Set<string>;
  unavailableRecipientIds: Set<string>;
  recipientIdsWithoutEvents: Set<string>;
};

export function classifyCampaignRecipientEligibility(
  recipients: PendingCampaignRecipientReference[],
  activeGuestIds: Set<string>,
  activeInvitationIds: Set<string>,
  guestIdsWithActiveEvents: Set<string>,
): CampaignRecipientEligibility {
  const sendableRecipientIds = new Set<string>();
  const unavailableRecipientIds = new Set<string>();
  const recipientIdsWithoutEvents = new Set<string>();

  for (const recipient of recipients) {
    if (
      !activeGuestIds.has(recipient.guestId) ||
      !activeInvitationIds.has(recipient.invitationId)
    ) {
      unavailableRecipientIds.add(recipient.recipientId);
      continue;
    }
    if (!guestIdsWithActiveEvents.has(recipient.guestId)) {
      recipientIdsWithoutEvents.add(recipient.recipientId);
      continue;
    }
    sendableRecipientIds.add(recipient.recipientId);
  }

  return {
    sendableRecipientIds,
    unavailableRecipientIds,
    recipientIdsWithoutEvents,
  };
}
