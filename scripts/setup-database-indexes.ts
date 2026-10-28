import { ensureAuthIndexes } from "../src/modules/auth/repositories/mongodb-auth.repository";
import { ensureWeddingIndexes } from "../src/modules/wedding/repositories/mongodb-wedding.repository";
import {
  closeMongoClient,
  getMongoDatabase,
} from "../src/server/providers/mongodb/client";

async function main() {
  const database = await getMongoDatabase();
  await Promise.all([ensureAuthIndexes(database), ensureWeddingIndexes(database)]);
  console.info("Vivaahly authentication and wedding indexes are ready.");
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
