import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { createWeddingSchema } from "@/modules/wedding/wedding.schemas";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import {
  mapMembershipContext,
  mapWeddingDto,
} from "@/modules/wedding/wedding.types";
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
      throw conflictError("Create a wedding before accessing the workspace.");
    }

    const wedding = await (
      await getWeddingService()
    ).getWeddingForOrganizer(organizer.membership);

    return apiDataResponse({ wedding: mapWeddingDto(wedding) }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "wedding.read",
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

    if (organizer.membership) {
      throw conflictError("Your account already belongs to a wedding.");
    }

    const input = await parseJson(request, createWeddingSchema);
    const result = await (
      await getWeddingService()
    ).createWedding(organizer.user.id, input);

    logger.info("Wedding workspace created", {
      requestId,
      weddingId: result.wedding.id,
      userId: organizer.user.id,
    });

    return apiDataResponse(
      {
        wedding: mapWeddingDto(result.wedding),
        membership: mapMembershipContext(result.membership),
      },
      requestId,
      201,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "wedding.create",
      startedAt,
    });
  }
}
