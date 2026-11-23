import { ensureAuthIndexes } from "../src/modules/auth/repositories/mongodb-auth.repository";
import { ensureWeddingIndexes } from "../src/modules/wedding/repositories/mongodb-wedding.repository";
import { ensureOrganizerIndexes } from "../src/modules/organizers/repositories/mongodb-organizer.repository";
import { ensureEventIndexes } from "../src/modules/events/repositories/mongodb-event.repository";
import { ensureGuestIndexes } from "../src/modules/guests/repositories/mongodb-guest.repository";
import { ensureGuestInvitationIndexes } from "../src/modules/guest-invitations/repositories/mongodb-guest-invitation.repository";
import {
  closeMongoClient,
  getMongoDatabase,
} from "../src/server/providers/mongodb/client";

async function main() {
  const database = await getMongoDatabase();
  await Promise.all([
    ensureAuthIndexes(database),
    ensureWeddingIndexes(database),
    ensureOrganizerIndexes(database),
    ensureEventIndexes(database),
    ensureGuestIndexes(database),
    ensureGuestInvitationIndexes(database),
  ]);
  console.info("Vivaahly authentication, wedding, organizer, event, guest, and invitation-delivery indexes are ready.");
}

async function run() {
  try {
    await main();
  } finally {
    await closeMongoClient();
  }
}

run().catch((error: unknown) => {
  console.error("Unable to prepare Vivaahly database indexes.", error);
  process.exitCode = 1;
});
