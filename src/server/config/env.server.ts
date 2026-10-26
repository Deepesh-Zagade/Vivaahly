import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const mongoEnvironmentSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  MONGODB_DB_NAME: z
    .string()
    .min(1, "MONGODB_DB_NAME is required.")
    .regex(/^[^/\\.\s"$*<>:|?]+$/, "MONGODB_DB_NAME contains unsupported characters."),
  MONGODB_DNS_SERVERS: z.string().optional(),
});

export const serverEnvironment = serverEnvironmentSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
});

export function getMongoEnvironment() {
  return mongoEnvironmentSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    MONGODB_DNS_SERVERS: process.env.MONGODB_DNS_SERVERS,
  });
}
