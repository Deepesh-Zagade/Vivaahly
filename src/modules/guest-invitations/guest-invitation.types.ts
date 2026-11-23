import type { GuestTag, GuestType } from "@/modules/guests/guest.types";
import type { LocalizedText } from "@/modules/wedding/wedding.types";

export const INVITATION_DELIVERY_STATUSES = [
  "NOT_SENT",
  "SENDING",
  "SENT",
  "FAILED",
  "REVOKED",
  "MISSING_EMAIL",
  "NEEDS_EVENTS",
  "RESTORED",
] as const;

export type InvitationDeliveryStatus =
  (typeof INVITATION_DELIVERY_STATUSES)[number];
export type GuestInvitationStatus = "ACTIVE" | "REVOKED";
export type EmailCampaignStatus =
  | "DRAFT"
  | "SENDING"
  | "PARTIAL"
  | "COMPLETED"
  | "FAILED";
export type EmailCampaignRecipientStatus = "PENDING" | "SENT" | "FAILED";

export type InvitationEventSummary = {
  id: string;
  title: LocalizedText;
  startAt: Date;
  endAt: Date;
  venueName?: string;
  venueAddress?: string;
  dressCode?: string;
};

export type GuestInvitationListItem = {
  guestId: string;
  guestType: GuestType;
  displayName: LocalizedText;
  primaryContact: {
    name: LocalizedText;
    email?: string;
    phone?: string;
  };
  tags: GuestTag[];
  invitationStatus: GuestInvitationStatus;
  deliveryStatus: InvitationDeliveryStatus;
  assignedEvents: InvitationEventSummary[];
  lastSentAt: Date | null;
  latestError: string | null;
  latestCampaignId: string | null;
};

export type InvitationDeliverySummary = {
  total: number;
  notSent: number;
  sending: number;
  sent: number;
  failed: number;
  revoked: number;
  missingEmail: number;
  needsEvents: number;
  restored: number;
  eligibleToSend: number;
};

export type InvitationListQuery = {
  q?: string;
  status?: InvitationDeliveryStatus;
  guestType?: GuestType;
  eventId?: string;
  page: number;
  pageSize: number;
};

export type InvitationCampaignProgress = {
  id: string;
  status: EmailCampaignStatus;
  totalRecipients: number;
  pending: number;
  sent: number;
  failed: number;
  createdByMembershipId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvitationHubResult = {
  invitations: GuestInvitationListItem[];
  summary: InvitationDeliverySummary;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  eligibleGuestIds: string[];
  retryableGuestIds: string[];
  latestCampaign: InvitationCampaignProgress | null;
};

export type CampaignRecipient = {
  id: string;
  campaignId: string;
  guestId: string;
  guestInvitationId: string;
  guestName: string;
  emailSnapshot: string;
  status: EmailCampaignRecipientStatus;
  attemptCount: number;
  providerMessageId: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
};

export type InvitationEmailContext = {
  recipientId: string;
  campaignId: string;
  guestId: string;
  guestInvitationId: string;
  accessKey: string;
  attemptCount: number;
  recipientEmail: string;
  guestName: string;
  primaryContactName: string;
  guestType: GuestType;
  coupleName: string;
  weddingTitle: string;
  weddingDate: Date;
  weddingTimezone: string;
  weddingCity: string;
  events: InvitationEventSummary[];
};

export type InvitationAccessContext = {
  guestId: string;
  guestName: string;
  primaryContactName: string;
  guestType: GuestType;
  coupleName: string;
  weddingTitle: string;
  weddingDate: Date;
  weddingTimezone: string;
  weddingCity: string;
  events: InvitationEventSummary[];
};

export type CampaignSendResult = {
  campaign: InvitationCampaignProgress;
  processed: number;
};
