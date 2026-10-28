import { NextResponse } from "next/server";
import { loginOrganizerSchema } from "@/modules/auth/auth.schemas";
import {
  getAuthService,
  ORGANIZER_SESSION_COOKIE,
} from "@/modules/auth/auth.server";
import { ORGANIZER_SESSION_DURATION_SECONDS } from "@/modules/auth/auth.service";
import { mapOrganizerUserDto } from "@/modules/auth/auth.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { serverEnvironment } from "@/server/config/env.server";
import { apiErrorResponse, getRequestId, parseJson } from "@/server/http/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();

  try {
    const input = await parseJson(request, loginOrganizerSchema);
    const authService = await getAuthService();
    const user = await authService.verifyCredentials(input);
    const membership = await (
      await getWeddingService()
    ).findActiveMembershipForUser(user.id);
    const session = await authService.createSession(user.id);
    const response = NextResponse.json(
      {
        data: {
          user: mapOrganizerUserDto(user),
          membership,
        },
      },
      {
        status: 200,
        headers: { "x-request-id": requestId },
      },
    );

    response.cookies.set({
      name: ORGANIZER_SESSION_COOKIE,
      value: session.rawToken,
      httpOnly: true,
      secure: serverEnvironment.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ORGANIZER_SESSION_DURATION_SECONDS,
      expires: session.expiresAt,
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer.login",
      startedAt,
    });
  }
}
