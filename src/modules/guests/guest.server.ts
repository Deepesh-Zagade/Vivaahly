import "server-only";

import { GuestService } from "@/modules/guests/guest.service";
import { MongoGuestRepository } from "@/modules/guests/repositories/mongodb-guest.repository";
import {
  getMongoClient,
  getMongoDatabase,
} from "@/server/providers/mongodb/client";

export async function getGuestService() {
  const [client, database] = await Promise.all([
    getMongoClient(),
    getMongoDatabase(),
  ]);
  return new GuestService({
    repository: new MongoGuestRepository(client, database),
  });
}
