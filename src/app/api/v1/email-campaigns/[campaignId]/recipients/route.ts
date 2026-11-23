import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { mapCampaignRecipientDto } from "@/modules/guest-invitations/guest-invitation.presentation";
import { campaignRecipientQuerySchema } from "@/modules/guest-invitations/guest-invitation.schemas";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";
import { conflictError, validationError } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) throw conflictError("Create a wedding before viewing invitations.");
    const url = new URL(request.url);
    const parsed = campaignRecipientQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) throw validationError("Invalid campaign recipient filters.");
    const result = await (
      await getGuestInvitationService()
    ).listRecipients(
      organizer.membership,
      (await params).campaignId,
      parsed.data,
    );
    return apiDataResponse(
      { ...result, recipients: result.recipients.map(mapCampaignRecipientDto) },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "email-campaigns.recipients.list",
      startedAt,
    });
  }
}
