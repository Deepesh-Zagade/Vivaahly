import { getCurrentOrganizer } from "@/modules/auth/auth.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await getCurrentOrganizer();
    const { token } = await context.params;
    const access = await (await getOrganizerService()).getInvitationAccess(token, organizer);
    return apiDataResponse(access, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer-invitations.access.read",
      startedAt,
    });
  }
}
