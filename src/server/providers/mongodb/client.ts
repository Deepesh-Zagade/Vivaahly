import "server-only";

import { Resolver } from "node:dns/promises";
import { MongoClient, type Db } from "mongodb";
import { getMongoEnvironment } from "@/server/config/env.server";

let mongoClientPromise: Promise<MongoClient> | undefined;

async function resolveMongoConnectionString(uri: string, dnsServers?: string) {
  if (!dnsServers || !uri.startsWith("mongodb+srv://")) return uri;

  const parsed = new URL(uri);
  const servers = dnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length === 0) return uri;

  const resolver = new Resolver();
  resolver.setServers(servers);

  const [srvRecords, txtRecords] = await Promise.all([
    resolver.resolveSrv(`_mongodb._tcp.${parsed.hostname}`),
    resolver.resolveTxt(parsed.hostname).catch(() => []),
  ]);

  const hosts = srvRecords
    .map((record) => `${record.name}:${record.port}`)
    .join(",");
  const options = new URLSearchParams(parsed.search);
  const atlasOptions = new URLSearchParams(txtRecords[0]?.join("") ?? "");

  for (const [key, value] of atlasOptions) {
    if (!options.has(key)) options.set(key, value);
  }

  options.set("tls", "true");

  const credentials = parsed.username
    ? `${parsed.username}${parsed.password ? `:${parsed.password}` : ""}@`
    : "";
  const pathname = parsed.pathname || "/";

  return `mongodb://${credentials}${hosts}${pathname}?${options.toString()}`;
}

async function connectMongoClient() {
  const { MONGODB_URI, MONGODB_DNS_SERVERS } = getMongoEnvironment();
  const connectionString = await resolveMongoConnectionString(
    MONGODB_URI,
    MONGODB_DNS_SERVERS,
  );
  const client = new MongoClient(connectionString);

  return client.connect();
}

export function getMongoClient() {
  if (!mongoClientPromise) {
    mongoClientPromise = connectMongoClient().catch((error: unknown) => {
      mongoClientPromise = undefined;
      throw error;
    });
  }

  return mongoClientPromise;
}

export async function getMongoDatabase(): Promise<Db> {
  const [{ MONGODB_DB_NAME }, client] = await Promise.all([
    Promise.resolve(getMongoEnvironment()),
    getMongoClient(),
  ]);

  return client.db(MONGODB_DB_NAME);
}

export async function closeMongoClient() {
  const activeClientPromise = mongoClientPromise;
  mongoClientPromise = undefined;

  if (activeClientPromise) {
    const client = await activeClientPromise;
    await client.close();
  }
}
