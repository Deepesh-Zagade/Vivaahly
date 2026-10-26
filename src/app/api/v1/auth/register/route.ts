import { registerOrganizerSchema } from "@/modules/auth/auth.schemas";
import { getAuthService } from "@/modules/auth/auth.server";
import { mapOrganizerUserDto } from "@/modules/auth/auth.types";
import {
  apiDataResponse,
  apiErrorResponse,
  getRequestId,
  parseJson,
} from "@/server/http/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const input = await parseJson(request, registerOrganizerSchema);
    const user = await (await getAuthService()).register(input);

    return apiDataResponse({ user: mapOrganizerUserDto(user) }, requestId, 201);
  } catch (error) {
    return apiErrorResponse(error, request, requestId);
  }
}
