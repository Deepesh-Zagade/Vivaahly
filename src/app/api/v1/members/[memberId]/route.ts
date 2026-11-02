import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { updateOrganizerMemberSchema } from "@/modules/organizers/organizer.schemas";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import {
  apiDataResponse,
  apiErrorResponse,
  apiNoContentResponse,
  getRequestId,
  parseJson,
} from "@/server/http/api";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    const input = await parseJson(request, updateOrganizerMemberSchema);
    const { memberId } = await context.params;
    const member = await (await getOrganizerService()).updateMemberRole(
      organizer,
      memberId,
      input,
    );
    return apiDataResponse(
      { member: { id: member.id, role: member.role, status: member.status } },
      requestId,
    );
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizers.members.update-role",
      startedAt,
    });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await requireCurrentOrganizer();
    const { memberId } = await context.params;
    await (await getOrganizerService()).removeMember(organizer, memberId);
    return apiNoContentResponse(requestId);
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizers.members.remove",
      startedAt,
    });
  }
}
