import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import { apiDataResponse, apiErrorResponse, getRequestId } from "@/server/http/api";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    const { id } = await context.params;
    const invitation = await (await getOrganizerService()).resendInvitation(organizer, id);
    return apiDataResponse(
      { invitation: { id: invitation.id, expiresAt: invitation.expiresAt?.toISOString() ?? null } },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer-invitations.resend",
      startedAt,
    });
  }
}
