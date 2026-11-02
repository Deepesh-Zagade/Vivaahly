import "server-only";

import { MongoOrganizerRepository } from "@/modules/organizers/repositories/mongodb-organizer.repository";
import { OrganizerService } from "@/modules/organizers/organizer.service";
import { getAppBaseUrl } from "@/server/config/env.server";
import { getMongoClient, getMongoDatabase } from "@/server/providers/mongodb/client";
import { ResendOrganizerInvitationMailer } from "@/server/providers/resend/organizer-invitation-mailer";

export async function getOrganizerService() {
  const [client, database] = await Promise.all([getMongoClient(), getMongoDatabase()]);
  return new OrganizerService({
    repository: new MongoOrganizerRepository(client, database),
    mailer: new ResendOrganizerInvitationMailer(),
    appBaseUrl: getAppBaseUrl,
  });
}
