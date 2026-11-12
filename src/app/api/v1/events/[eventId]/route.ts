import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { updateEventSchema } from "@/modules/events/event.schemas";
import { getEventService } from "@/modules/events/event.server";
import { mapWeddingEventDto } from "@/modules/events/event.types";
import {
  apiDataResponse,
  apiErrorResponse,
  apiNoContentResponse,
  getRequestId,
  parseJson,
} from "@/server/http/api";
import { conflictError } from "@/server/http/errors";
import { logger } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ eventId: string }> };

async function organizerWithWedding() {
  const organizer = await requireCurrentOrganizer();
  if (!organizer.membership) {
    throw conflictError("Create a wedding before managing events.");
  }
  return { ...organizer, membership: organizer.membership };
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await organizerWithWedding();
    const { eventId } = await context.params;
    const event = await (await getEventService()).getEvent(
      organizer.membership,
      eventId,
    );
    return apiDataResponse({ event: mapWeddingEventDto(event) }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "events.read",
      startedAt,
    });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await organizerWithWedding();
    const input = await parseJson(request, updateEventSchema);
    const { eventId } = await context.params;
    const event = await (await getEventService()).updateEvent(
      organizer.membership,
      eventId,
      input,
    );
    logger.info("Wedding event updated", {
      requestId,
      eventId,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiDataResponse({ event: mapWeddingEventDto(event) }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "events.update",
      startedAt,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await organizerWithWedding();
    const { eventId } = await context.params;
    await (await getEventService()).removeEvent(organizer.membership, eventId);
    logger.info("Wedding event removed", {
      requestId,
      eventId,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiNoContentResponse(requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "events.remove",
      startedAt,
    });
  }
}
