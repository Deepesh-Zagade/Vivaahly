import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { assignGuestEventsSchema } from "@/modules/guests/guest.schemas";
import { getGuestService } from "@/modules/guests/guest.server";
import {
  apiDataResponse,
  apiErrorResponse,
  getRequestId,
  parseJson,
} from "@/server/http/api";
import { conflictError } from "@/server/http/errors";
import { logger } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ guestId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) {
      throw conflictError("Create a wedding before assigning guest events.");
    }
    const input = await parseJson(request, assignGuestEventsSchema);
    const { guestId } = await context.params;
    await (await getGuestService()).assignEvents(
      organizer.membership,
      guestId,
      input,
    );
    logger.info("Guest event access updated", {
      requestId,
      guestId,
      eventCount: input.eventIds.length,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiDataResponse({ guestId, eventIds: input.eventIds }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guests.events.replace",
      startedAt,
    });
  }
}
