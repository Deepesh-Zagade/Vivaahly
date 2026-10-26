import { ensureAuthIndexes } from "../src/modules/auth/repositories/mongodb-auth.repository";
import {
  closeMongoClient,
  getMongoDatabase,
} from "../src/server/providers/mongodb/client";

async function main() {
  const database = await getMongoDatabase();
  await ensureAuthIndexes(database);
  console.info("Vivaahly authentication indexes are ready.");
}

async function run() {
  try {
    await main();
  } finally {
    await closeMongoClient();
  }
}

run().catch((error: unknown) => {
  console.error("Unable to prepare Vivaahly authentication indexes.", error);
  process.exitCode = 1;
});
