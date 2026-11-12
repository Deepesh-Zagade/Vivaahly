import { ensureAuthIndexes } from "../src/modules/auth/repositories/mongodb-auth.repository";
import { ensureWeddingIndexes } from "../src/modules/wedding/repositories/mongodb-wedding.repository";
import { ensureOrganizerIndexes } from "../src/modules/organizers/repositories/mongodb-organizer.repository";
import { ensureEventIndexes } from "../src/modules/events/repositories/mongodb-event.repository";
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
  ]);
  console.info("Vivaahly authentication, wedding, organizer, and event indexes are ready.");
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
