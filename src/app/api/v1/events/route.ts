import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { createEventSchema } from "@/modules/events/event.schemas";
import { getEventService } from "@/modules/events/event.server";
import { mapWeddingEventDto } from "@/modules/events/event.types";
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

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) {
      throw conflictError("Create a wedding before managing events.");
    }
    const events = await (await getEventService()).listEvents(
      organizer.membership,
    );
    return apiDataResponse(
      { events: events.map(mapWeddingEventDto) },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "events.list",
      startedAt,
    });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) {
      throw conflictError("Create a wedding before creating an event.");
    }
    const input = await parseJson(request, createEventSchema);
    const event = await (await getEventService()).createEvent(
      organizer.membership,
      input,
    );
    logger.info("Wedding event created", {
      requestId,
      eventId: event.id,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiDataResponse(
      { event: mapWeddingEventDto(event) },
      requestId,
      201,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "events.create",
      startedAt,
    });
  }
}
