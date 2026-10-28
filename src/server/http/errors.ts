export const APPLICATION_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "GUEST_ACCESS_REQUIRED",
  "MEDIA_ACCESS_REQUIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "SERVICE_UNAVAILABLE",
  "EXTERNAL_SERVICE_ERROR",
  "INTERNAL_ERROR",
] as const;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[number];

type ApplicationErrorOptions = {
  code: ApplicationErrorCode;
  status: number;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor({ code, status, message, details, cause }: ApplicationErrorOptions) {
    super(message, { cause });
    this.name = "ApplicationError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function validationError(
  message = "The request could not be processed.",
  details?: Record<string, unknown>,
) {
  return new ApplicationError({ code: "VALIDATION_ERROR", status: 400, message, details });
}

export function conflictError(message: string, details?: Record<string, unknown>) {
  return new ApplicationError({ code: "CONFLICT", status: 409, message, details });
}

export function unauthenticatedError(message = "Authentication is required.") {
  return new ApplicationError({ code: "UNAUTHENTICATED", status: 401, message });
}

export function forbiddenError(message = "You do not have permission to perform this action.") {
  return new ApplicationError({ code: "FORBIDDEN", status: 403, message });
}

export function notFoundError(message = "The requested resource was not found.") {
  return new ApplicationError({ code: "NOT_FOUND", status: 404, message });
}

export function serviceUnavailableError(
  message = "Vivaahly is temporarily unable to connect to the database. Please try again shortly.",
) {
  return new ApplicationError({
    code: "SERVICE_UNAVAILABLE",
    status: 503,
    message,
  });
}
