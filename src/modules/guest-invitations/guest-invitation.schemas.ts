import { z } from "zod";
import { INVITATION_DELIVERY_STATUSES } from "@/modules/guest-invitations/guest-invitation.types";

export const invitationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().transform((value) => value || undefined),
  status: z.enum(INVITATION_DELIVERY_STATUSES).optional(),
  guestType: z.enum(["INDIVIDUAL", "FAMILY"]).optional(),
  eventId: z.string().trim().optional().transform((value) => value || undefined),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine((value) => [10, 50, 100].includes(value), {
    message: "Page size must be 10, 50, or 100.",
  }).default(10),
});

export const createInvitationCampaignSchema = z.object({
  guestIds: z.array(z.string().trim().min(1)).min(1).max(1_000),
  resend: z.boolean().default(false),
});

export const updateInvitationEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
});

export const campaignRecipientQuerySchema = z.object({
  status: z.enum(["PENDING", "SENT", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateInvitationCampaignInput = z.infer<
  typeof createInvitationCampaignSchema
>;
