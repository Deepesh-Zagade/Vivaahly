import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function createOrganizerInvitationToken() {
  const rawToken = randomBytes(32).toString("base64url");

  return {
    rawToken,
    tokenHash: hashOrganizerInvitationToken(rawToken),
  };
}

export function hashOrganizerInvitationToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}
