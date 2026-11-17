import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  createGuestSchema,
  guestListQuerySchema,
} from "@/modules/guests/guest.schemas";
import { getGuestService } from "@/modules/guests/guest.server";
import { mapGuestDto } from "@/modules/guests/guest.types";
import {
  apiDataResponse,
  apiErrorResponse,
  getRequestId,
  parseJson,
} from "@/server/http/api";
import { conflictError, validationError } from "@/server/http/errors";
import { logger } from "@/server/observability/logger";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

async function organizerWithWedding() {
  const organizer = await requireCurrentOrganizer();
  if (!organizer.membership) {
    throw conflictError("Create a wedding before managing guests.");
  }
  return { ...organizer, membership: organizer.membership };
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await organizerWithWedding();
    const url = new URL(request.url);
    const parsed = guestListQuerySchema.safeParse({
      q: url.searchParams.get("q") || undefined,
      guestType: url.searchParams.get("guestType") || undefined,
      tag: url.searchParams.get("tag") || undefined,
      eventId: url.searchParams.get("eventId") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    });
    if (!parsed.success) {
      throw validationError("One or more guest filters are invalid.");
    }
    const result = await (await getGuestService()).listGuests(
      organizer.membership,
      parsed.data,
    );
    return apiDataResponse(
      { ...result, guests: result.guests.map(mapGuestDto) },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guests.list",
      startedAt,
    });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await organizerWithWedding();
    const input = await parseJson(request, createGuestSchema);
    const guest = await (await getGuestService()).createGuest(
      organizer.membership,
      input,
    );
    logger.info("Wedding guest created", {
      requestId,
      guestId: guest.id,
      weddingId: organizer.membership.weddingId,
      userId: organizer.user.id,
    });
    return apiDataResponse({ guest: mapGuestDto(guest) }, requestId, 201);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guests.create",
      startedAt,
    });
  }
}
