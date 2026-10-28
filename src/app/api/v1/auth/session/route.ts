import { getCurrentOrganizer } from "@/modules/auth/auth.server";
import { mapOrganizerUserDto } from "@/modules/auth/auth.types";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";
import { unauthenticatedError } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();

  try {
    const organizer = await getCurrentOrganizer();

    if (!organizer) throw unauthenticatedError();

    return apiDataResponse(
      {
        user: mapOrganizerUserDto(organizer.user),
        membership: organizer.membership,
      },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer.session.read",
      startedAt,
    });
  }
}
