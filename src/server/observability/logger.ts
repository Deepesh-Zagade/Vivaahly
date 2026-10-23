import "server-only";

type LogFields = Record<string, boolean | number | string | null | undefined>;

const SENSITIVE_FIELD_FRAGMENTS = [
  "password",
  "token",
  "accesskey",
  "apikey",
  "secret",
  "authorization",
  "cookie",
  "presignedurl",
];

function isSensitiveFieldName(fieldName: string) {
  const normalizedFieldName = fieldName.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) => normalizedFieldName.includes(fragment));
}

function sanitize(fields: LogFields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      isSensitiveFieldName(key) ? "[REDACTED]" : value,
    ]),
  );
}

function write(level: "info" | "warn" | "error", message: string, fields: LogFields = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitize(fields),
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.info(entry);
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
