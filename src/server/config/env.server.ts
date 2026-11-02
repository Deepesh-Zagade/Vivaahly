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
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(30_000)
    .default(30_000),
  MONGODB_CONNECT_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(30_000)
    .default(30_000),
  MONGODB_HEARTBEAT_FREQUENCY_MS: z.coerce
    .number()
    .int()
    .min(500)
    .max(60_000)
    .default(10_000),
});

const emailEnvironmentSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required."),
  RESEND_FROM_EMAIL: z.string().min(1, "RESEND_FROM_EMAIL is required."),
});

const appOriginSchema = z
  .string()
  .trim()
  .url("APP_BASE_URL must be a valid URL.")
  .refine((value) => {
    const url = new URL(value);
    return (
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  }, "APP_BASE_URL must contain only the application origin.")
  .transform((value) => new URL(value).origin);

type AppBaseUrlInput = {
  nodeEnv: "development" | "test" | "production";
  appBaseUrl: string | undefined;
};

export function resolveAppBaseUrl({ nodeEnv, appBaseUrl }: AppBaseUrlInput) {
  if (!appBaseUrl && nodeEnv === "production") {
    throw new Error("APP_BASE_URL is required in production.");
  }

  const origin = appOriginSchema.parse(appBaseUrl ?? "http://localhost:3000");
  if (nodeEnv !== "production") return origin;

  const url = new URL(origin);
  const hostname = url.hostname.toLowerCase();
  const isLoopback =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname);

  if (url.protocol !== "https:" || isLoopback) {
    throw new Error(
      "APP_BASE_URL must be a public HTTPS application origin in production.",
    );
  }

  return origin;
}

export const serverEnvironment = serverEnvironmentSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
});

export function getMongoEnvironment() {
  return mongoEnvironmentSchema.parse({
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    MONGODB_DNS_SERVERS: process.env.MONGODB_DNS_SERVERS,
    MONGODB_SERVER_SELECTION_TIMEOUT_MS:
      process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    MONGODB_CONNECT_TIMEOUT_MS: process.env.MONGODB_CONNECT_TIMEOUT_MS,
    MONGODB_HEARTBEAT_FREQUENCY_MS:
      process.env.MONGODB_HEARTBEAT_FREQUENCY_MS,
  });
}

export function getEmailEnvironment() {
  return emailEnvironmentSchema.parse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  });
}

export function getAppBaseUrl() {
  return resolveAppBaseUrl({
    nodeEnv: serverEnvironment.NODE_ENV,
    appBaseUrl: process.env.APP_BASE_URL,
  });
}
