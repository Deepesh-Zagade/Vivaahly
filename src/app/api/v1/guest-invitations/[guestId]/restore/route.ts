import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { apiErrorResponse, apiNoContentResponse, getRequestId } from "@/server/http/api";
import { conflictError } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) {
      throw conflictError("Create a wedding before managing invitations.");
    }
    await (
      await getGuestInvitationService()
    ).restore(organizer.membership, (await params).guestId);
    return apiNoContentResponse(requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guest-invitations.restore",
      startedAt,
    });
  }
}
