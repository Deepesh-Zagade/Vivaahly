import { NextResponse } from "next/server";
import {
  getCurrentOrganizer,
  ORGANIZER_SESSION_COOKIE,
} from "@/modules/auth/auth.server";
import { acceptOrganizerInvitationSchema } from "@/modules/organizers/organizer.schemas";
import { getOrganizerService } from "@/modules/organizers/organizer.server";
import { mapMembershipContext } from "@/modules/wedding/wedding.types";
import { serverEnvironment } from "@/server/config/env.server";
import { apiErrorResponse, getRequestId, parseJson } from "@/server/http/api";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  try {
    assertSameOrigin(request);
    const organizer = await getCurrentOrganizer();
    const input = await parseJson(request, acceptOrganizerInvitationSchema);
    const { token } = await context.params;
    const accepted = await (await getOrganizerService()).acceptInvitation(
      token,
      organizer,
      input,
    );
    const response = NextResponse.json(
      {
        data: {
          user: {
            id: accepted.result.user.id,
            name: accepted.result.user.name,
            email: accepted.result.user.email,
          },
          membership: mapMembershipContext(accepted.result.membership),
        },
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
    if (accepted.session) {
      response.cookies.set({
        name: ORGANIZER_SESSION_COOKIE,
        value: accepted.session.rawToken,
        httpOnly: true,
        secure: serverEnvironment.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: accepted.session.expiresAt,
        maxAge: Math.max(
          0,
          Math.floor((accepted.session.expiresAt.getTime() - Date.now()) / 1_000),
        ),
      });
    }
    return response;
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer-invitations.access.accept",
      startedAt,
    });
  }
}
