import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { updateInvitationEmailSchema } from "@/modules/guest-invitations/guest-invitation.schemas";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { apiNoContentResponse, apiErrorResponse, getRequestId, parseJson } from "@/server/http/api";
import { conflictError } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    if (!organizer.membership) throw conflictError("Create a wedding before managing invitations.");
    const input = await parseJson(request, updateInvitationEmailSchema);
    await (
      await getGuestInvitationService()
    ).updateEmail(organizer.membership, (await params).guestId, input.email);
    return apiNoContentResponse(requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "guest-invitations.email.update",
      startedAt,
    });
  }
}
