import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { mapCampaignDto } from "@/modules/guest-invitations/guest-invitation.presentation";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";
import { conflictError } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) throw conflictError("Create a wedding before sending invitations.");
    const result = await (
      await getGuestInvitationService()
    ).sendNext(organizer.membership, (await params).campaignId);
    return apiDataResponse(
      { campaign: mapCampaignDto(result.campaign), processed: result.processed },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "email-campaigns.send-next",
      startedAt,
    });
  }
}
