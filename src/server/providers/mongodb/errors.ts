import "server-only";

import {
  MongoNetworkError,
  MongoNetworkTimeoutError,
  MongoServerSelectionError,
} from "mongodb";

type ErrorWithDiagnostics = Error & {
  code?: string | number;
  reason?: { type?: string };
  cause?: unknown;
};

function errorChain(error: unknown) {
  const errors: unknown[] = [];
  let current = error;

  for (let depth = 0; current && depth < 5; depth += 1) {
    errors.push(current);
    current =
      current instanceof Error && "cause" in current
        ? (current as ErrorWithDiagnostics).cause
        : undefined;
  }

  return errors;
}

function isMongoAvailabilityErrorInstance(error: unknown) {
  return (
    error instanceof MongoServerSelectionError ||
    error instanceof MongoNetworkTimeoutError ||
    error instanceof MongoNetworkError ||
    (error instanceof Error &&
      [
        "MongoServerSelectionError",
        "MongoNetworkTimeoutError",
        "MongoNetworkError",
      ].includes(error.name))
  );
}

export function isMongoUnavailableError(error: unknown) {
  return errorChain(error).some(isMongoAvailabilityErrorInstance);
}

export function getMongoErrorDiagnostics(error: unknown) {
  const mongoError = errorChain(error).find(isMongoAvailabilityErrorInstance);

  if (!(mongoError instanceof Error)) {
    return {
      mongoErrorName: "UnknownMongoError",
      mongoErrorCode: undefined,
      topologyState: undefined,
    };
  }

  const diagnosticError = mongoError as ErrorWithDiagnostics;

  return {
    mongoErrorName: diagnosticError.name,
    mongoErrorCode:
      diagnosticError.code === undefined
        ? undefined
        : String(diagnosticError.code),
    topologyState: diagnosticError.reason?.type,
  };
}
