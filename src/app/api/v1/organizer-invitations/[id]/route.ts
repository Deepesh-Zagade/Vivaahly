import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import {
  apiErrorResponse,
  apiNoContentResponse,
  getRequestId,
} from "@/server/http/api";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    const { id } = await context.params;
    await (await getOrganizerService()).revokeInvitation(organizer, id);
    return apiNoContentResponse(requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer-invitations.revoke",
      startedAt,
    });
  }
}
