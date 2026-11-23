import "server-only";

import { GuestInvitationService } from "@/modules/guest-invitations/guest-invitation.service";
import { MongoGuestInvitationRepository } from "@/modules/guest-invitations/repositories/mongodb-guest-invitation.repository";
import { getMongoClient, getMongoDatabase } from "@/server/providers/mongodb/client";
import { ResendGuestInvitationMailer } from "@/server/providers/resend/guest-invitation-mailer";

export async function getGuestInvitationService() {
  const [client, database] = await Promise.all([
    getMongoClient(),
    getMongoDatabase(),
  ]);
  return new GuestInvitationService({
    repository: new MongoGuestInvitationRepository(client, database),
    mailer: new ResendGuestInvitationMailer(),
  });
}
