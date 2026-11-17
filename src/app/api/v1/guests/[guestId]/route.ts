import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { updateGuestSchema } from "@/modules/guests/guest.schemas";
import { getGuestService } from "@/modules/guests/guest.server";
import { mapGuestDto } from "@/modules/guests/guest.types";
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

type RouteContext = { params: Promise<{ guestId: string }> };

async function organizerWithWedding() {
  const organizer = await requireCurrentOrganizer();
  if (!organizer.membership) {
    throw conflictError("Create a wedding before managing guests.");
  }
  return { ...organizer, membership: organizer.membership };
}

export async function GET(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await organizerWithWedding();
    const { guestId } = await context.params;
    const details = await (await getGuestService()).getGuest(
      organizer.membership,
      guestId,
    );
    return apiDataResponse(
      { guest: mapGuestDto(details.guest), eventIds: details.eventIds },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guests.read",
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
    const input = await parseJson(request, updateGuestSchema);
    const { guestId } = await context.params;
    const guest = await (await getGuestService()).updateGuest(
      organizer.membership,
      guestId,
      input,
    );
    logger.info("Wedding guest updated", {
      requestId,
      guestId,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiDataResponse({ guest: mapGuestDto(guest) }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guests.update",
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
    const { guestId } = await context.params;
    await (await getGuestService()).removeGuest(
      organizer.membership,
      guestId,
    );
    logger.info("Wedding guest removed", {
      requestId,
      guestId,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiNoContentResponse(requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guests.remove",
      startedAt,
    });
  }
}
