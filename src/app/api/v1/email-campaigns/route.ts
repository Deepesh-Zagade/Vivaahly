import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { mapCampaignDto } from "@/modules/guest-invitations/guest-invitation.presentation";
import { createInvitationCampaignSchema } from "@/modules/guest-invitations/guest-invitation.schemas";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { apiDataResponse, apiErrorResponse, getRequestId, parseJson } from "@/server/http/api";
import { conflictError } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) throw conflictError("Create a wedding before sending invitations.");
    const input = await parseJson(request, createInvitationCampaignSchema);
    const campaign = await (
      await getGuestInvitationService()
    ).createCampaign(organizer.membership, input);
    return apiDataResponse({ campaign: mapCampaignDto(campaign) }, requestId, 201);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "email-campaigns.create",
      startedAt,
    });
  }
}
