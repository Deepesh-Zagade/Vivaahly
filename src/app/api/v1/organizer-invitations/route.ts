import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { createOrganizerInvitationSchema } from "@/modules/organizers/organizer.schemas";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import {
  apiDataResponse,
  apiErrorResponse,
  getRequestId,
  parseJson,
} from "@/server/http/api";
import { assertSameOrigin } from "@/server/security/same-origin";
import { forbiddenError } from "@/server/http/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    const organizer = await requireCurrentOrganizer();
    const management = await (await getOrganizerService()).getOrganizerManagement(organizer);
    if (!management.canManage) {
      throw forbiddenError("Only wedding Admins can view organizer invitations.");
    }
    return apiDataResponse({ invitations: management.invitations }, requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer-invitations.list",
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
    const input = await parseJson(request, createOrganizerInvitationSchema);
    const invitation = await (await getOrganizerService()).createInvitation(organizer, input);
    return apiDataResponse(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt?.toISOString() ?? null,
          createdAt: invitation.createdAt.toISOString(),
        },
      },
      requestId,
      201,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer-invitations.create",
      startedAt,
    });
  }
}
