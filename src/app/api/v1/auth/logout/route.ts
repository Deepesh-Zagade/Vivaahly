import type { NextRequest } from "next/server";
import {
  getAuthService,
  ORGANIZER_SESSION_COOKIE,
} from "@/modules/auth/auth.server";
import { serverEnvironment } from "@/server/config/env.server";
import {
  apiErrorResponse,
  apiNoContentResponse,
  getRequestId,
} from "@/server/http/api";
import { assertSameOrigin } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();

  try {
    assertSameOrigin(request);
    const rawToken = request.cookies.get(ORGANIZER_SESSION_COOKIE)?.value;

    if (rawToken) {
      await (await getAuthService()).logout(rawToken);
    }

    const response = apiNoContentResponse(requestId);
    response.cookies.set({
      name: ORGANIZER_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: serverEnvironment.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return apiErrorResponse(error, request, requestId, {
      operation: "organizer.logout",
      startedAt,
    });
  }
}
