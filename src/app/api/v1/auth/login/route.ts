import { NextResponse } from "next/server";
import { loginOrganizerSchema } from "@/modules/auth/auth.schemas";
import {
  getAuthService,
  ORGANIZER_SESSION_COOKIE,
} from "@/modules/auth/auth.server";
import { ORGANIZER_SESSION_DURATION_SECONDS } from "@/modules/auth/auth.service";
import { mapOrganizerUserDto } from "@/modules/auth/auth.types";
import { serverEnvironment } from "@/server/config/env.server";
import { apiErrorResponse, getRequestId, parseJson } from "@/server/http/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const input = await parseJson(request, loginOrganizerSchema);
    const result = await (await getAuthService()).login(input);
    const response = NextResponse.json(
      {
        data: {
          user: mapOrganizerUserDto(result.user),
          membership: null,
        },
      },
      {
        status: 200,
        headers: { "x-request-id": requestId },
      },
    );

    response.cookies.set({
      name: ORGANIZER_SESSION_COOKIE,
      value: result.rawToken,
      httpOnly: true,
      secure: serverEnvironment.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ORGANIZER_SESSION_DURATION_SECONDS,
      expires: result.expiresAt,
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, request, requestId);
  }
}
