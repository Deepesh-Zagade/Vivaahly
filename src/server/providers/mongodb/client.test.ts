import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setServers: vi.fn(),
  constructClient: vi.fn(),
  connect: vi.fn(),
  close: vi.fn(),
  environment: {
    MONGODB_URI: "mongodb+srv://user:password@cluster.example/",
    MONGODB_DB_NAME: "vivaahly_test",
    MONGODB_DNS_SERVERS: "8.8.8.8, 1.1.1.1",
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: 30_000,
    MONGODB_CONNECT_TIMEOUT_MS: 30_000,
    MONGODB_HEARTBEAT_FREQUENCY_MS: 10_000,
  },
}));

vi.mock("node:dns", () => ({
  setServers: mocks.setServers,
}));

vi.mock("@/server/config/env.server", () => ({
  getMongoEnvironment: () => mocks.environment,
}));

vi.mock("mongodb", () => {
  class MongoClient {
    constructor(uri: string, options: object) {
      mocks.constructClient(uri, options);
    }

    connect() {
      return mocks.connect(this);
    }

    close() {
      return mocks.close();
    }

    db(name: string) {
      return { name };
    }
  }

  return { MongoClient };
});

import {
  closeMongoClient,
  getMongoClient,
} from "@/server/providers/mongodb/client";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.connect.mockImplementation((client) => Promise.resolve(client));
  mocks.close.mockResolvedValue(undefined);
});

afterEach(async () => {
  await closeMongoClient().catch(() => undefined);
});

describe("MongoDB client lifecycle", () => {
  it("keeps the original SRV URI and reuses one global connection promise", async () => {
    const first = getMongoClient();
    const second = getMongoClient();

    expect(first).toBe(second);
    await expect(first).resolves.toBeDefined();
    expect(mocks.setServers).toHaveBeenCalledWith(["8.8.8.8", "1.1.1.1"]);
    expect(mocks.constructClient).toHaveBeenCalledOnce();
    expect(mocks.constructClient).toHaveBeenCalledWith(
      mocks.environment.MONGODB_URI,
      expect.objectContaining({
        serverSelectionTimeoutMS: 30_000,
        connectTimeoutMS: 30_000,
        heartbeatFrequencyMS: 10_000,
        retryReads: true,
        retryWrites: true,
      }),
    );
  });

  it("clears a rejected connection so a later request can reconnect", async () => {
    const connectionError = new Error("Connection failed");
    mocks.connect
      .mockRejectedValueOnce(connectionError)
      .mockImplementationOnce((client) => Promise.resolve(client));

    await expect(getMongoClient()).rejects.toBe(connectionError);
    await expect(getMongoClient()).resolves.toBeDefined();

    expect(mocks.constructClient).toHaveBeenCalledTimes(2);
  });

  it("creates a new connection after an explicit close", async () => {
    await getMongoClient();
    await closeMongoClient();
    await getMongoClient();

    expect(mocks.constructClient).toHaveBeenCalledTimes(2);
    expect(mocks.close).toHaveBeenCalledOnce();
  });
});
