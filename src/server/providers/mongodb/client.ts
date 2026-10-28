import "server-only";

import { setServers } from "node:dns";
import { MongoClient, type Db } from "mongodb";
import { getMongoEnvironment } from "@/server/config/env.server";

type MongoGlobalState = typeof globalThis & {
  __vivaahlyMongoClientPromise?: Promise<MongoClient>;
};

const mongoGlobalState = globalThis as MongoGlobalState;

function configureMongoDns(uri: string, dnsServers?: string) {
  if (!dnsServers || !uri.startsWith("mongodb+srv://")) return;

  const servers = dnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) setServers(servers);
}

async function connectMongoClient() {
  const {
    MONGODB_URI,
    MONGODB_DNS_SERVERS,
    MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    MONGODB_CONNECT_TIMEOUT_MS,
    MONGODB_HEARTBEAT_FREQUENCY_MS,
  } = getMongoEnvironment();

  configureMongoDns(MONGODB_URI, MONGODB_DNS_SERVERS);

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS: MONGODB_CONNECT_TIMEOUT_MS,
    heartbeatFrequencyMS: MONGODB_HEARTBEAT_FREQUENCY_MS,
    retryReads: true,
    retryWrites: true,
    appName: "vivaahly",
  });

  return client.connect();
}

export function getMongoClient() {
  if (!mongoGlobalState.__vivaahlyMongoClientPromise) {
    const cachedPromise = connectMongoClient().catch((error: unknown) => {
      if (mongoGlobalState.__vivaahlyMongoClientPromise === cachedPromise) {
        mongoGlobalState.__vivaahlyMongoClientPromise = undefined;
      }
      throw error;
    });

    mongoGlobalState.__vivaahlyMongoClientPromise = cachedPromise;
  }

  return mongoGlobalState.__vivaahlyMongoClientPromise;
}

export async function getMongoDatabase(): Promise<Db> {
  const [{ MONGODB_DB_NAME }, client] = await Promise.all([
    Promise.resolve(getMongoEnvironment()),
    getMongoClient(),
  ]);

  return client.db(MONGODB_DB_NAME);
}

export async function closeMongoClient() {
  const activeClientPromise = mongoGlobalState.__vivaahlyMongoClientPromise;
  mongoGlobalState.__vivaahlyMongoClientPromise = undefined;

  if (activeClientPromise) {
    const client = await activeClientPromise;
    await client.close();
  }
}
