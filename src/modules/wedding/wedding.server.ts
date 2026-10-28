import "server-only";

import { MongoWeddingRepository } from "@/modules/wedding/repositories/mongodb-wedding.repository";
import { WeddingService } from "@/modules/wedding/wedding.service";
import {
  getMongoClient,
  getMongoDatabase,
} from "@/server/providers/mongodb/client";

export async function getWeddingService() {
  const [client, database] = await Promise.all([
    getMongoClient(),
    getMongoDatabase(),
  ]);

  return new WeddingService({
    repository: new MongoWeddingRepository(client, database),
  });
}
