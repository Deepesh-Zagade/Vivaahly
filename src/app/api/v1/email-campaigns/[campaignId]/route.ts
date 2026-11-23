import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { mapCampaignDto } from "@/modules/guest-invitations/guest-invitation.presentation";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";
import { conflictError } from "@/server/http/errors";

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
    const campaign = await (
      await getGuestInvitationService()
    ).getCampaign(organizer.membership, (await params).campaignId);
    return apiDataResponse({ campaign: mapCampaignDto(campaign) }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "email-campaigns.read",
      startedAt,
    });
  }
}
