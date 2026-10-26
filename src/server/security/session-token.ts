import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashSessionToken(rawToken: string) {
  return createHash("sha256").update(rawToken, "utf8").digest("base64url");
}

export function createSessionToken() {
  const rawToken = randomBytes(32).toString("base64url");

  return {
    rawToken,
    tokenHash: hashSessionToken(rawToken),
  };
}
