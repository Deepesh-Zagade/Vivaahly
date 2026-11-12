import "server-only";

import { MongoEventRepository } from "@/modules/events/repositories/mongodb-event.repository";
import { EventService } from "@/modules/events/event.service";
import {
  getMongoClient,
  getMongoDatabase,
} from "@/server/providers/mongodb/client";

export async function getEventService() {
  const [client, database] = await Promise.all([
    getMongoClient(),
    getMongoDatabase(),
  ]);
  return new EventService({
    repository: new MongoEventRepository(client, database),
  });
}
