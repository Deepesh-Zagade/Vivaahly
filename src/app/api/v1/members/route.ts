import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await requireCurrentOrganizer();
    const management = await (await getOrganizerService()).getOrganizerManagement(organizer);
    return apiDataResponse({ members: management.members }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizers.members.list",
      startedAt,
    });
  }
}
