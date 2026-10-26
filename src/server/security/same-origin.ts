import "server-only";

import { forbiddenError } from "@/server/http/errors";

export function assertSameOrigin(request: Request) {
  const requestOrigin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!requestOrigin) {
    if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
      throw forbiddenError("This request did not originate from Vivaahly.");
    }

    return;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const requestUrl = new URL(request.url);
  const expectedOrigin = forwardedHost
    ? `${forwardedProtocol ?? requestUrl.protocol.replace(":", "")}://${forwardedHost}`
    : requestUrl.origin;

  if (requestOrigin !== expectedOrigin) {
    throw forbiddenError("This request did not originate from Vivaahly.");
  }
}
