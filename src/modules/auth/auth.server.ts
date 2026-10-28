import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { MongoAuthRepository } from "@/modules/auth/repositories/mongodb-auth.repository";
import { AuthService } from "@/modules/auth/auth.service";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { unauthenticatedError } from "@/server/http/errors";
import { getMongoDatabase } from "@/server/providers/mongodb/client";

export const ORGANIZER_SESSION_COOKIE = "vivaahly_session";

export async function getAuthService() {
  return new AuthService({
    repository: new MongoAuthRepository(await getMongoDatabase()),
  });
}

export const getCurrentOrganizer = cache(async () => {
  const rawToken = (await cookies()).get(ORGANIZER_SESSION_COOKIE)?.value;

  if (!rawToken) return null;

  const organizer = await (await getAuthService()).authenticate(rawToken);

  if (!organizer) return null;

  const membership = await (
    await getWeddingService()
  ).findActiveMembershipForUser(organizer.user.id);

  return { ...organizer, membership };
});

export async function requireCurrentOrganizer() {
  const organizer = await getCurrentOrganizer();

  if (!organizer) throw unauthenticatedError();

  return organizer;
}
