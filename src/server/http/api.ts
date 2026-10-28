import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ApplicationError,
  serviceUnavailableError,
  validationError,
} from "@/server/http/errors";
import { logger } from "@/server/observability/logger";
import {
  getMongoErrorDiagnostics,
  isMongoUnavailableError,
} from "@/server/providers/mongodb/errors";

type ApiErrorContext = {
  operation: string;
  startedAt: number;
};

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? `req_${randomUUID()}`;
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw validationError("The request body must be valid JSON.");
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const flattened = z.flattenError(result.error);
    throw validationError("The request could not be processed.", {
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    });
  }

  return result.data;
}

export function apiDataResponse<T>(data: T, requestId: string, status = 200) {
  return NextResponse.json(
    { data },
    {
      status,
      headers: { "x-request-id": requestId },
    },
  );
}

export function apiNoContentResponse(requestId: string) {
  return new NextResponse(null, {
    status: 204,
    headers: { "x-request-id": requestId },
  });
}

export function apiErrorResponse(
  error: unknown,
  request: Request,
  requestId: string,
  context?: ApiErrorContext,
) {
  const operation =
    context?.operation ?? `${request.method} ${new URL(request.url).pathname}`;
  const durationMs = context ? Date.now() - context.startedAt : undefined;

  if (error instanceof ApplicationError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          requestId,
        },
      },
      {
        status: error.status,
        headers: { "x-request-id": requestId },
      },
    );
  }

  if (isMongoUnavailableError(error)) {
    const unavailable = serviceUnavailableError();

    logger.error("MongoDB operation unavailable", {
      requestId,
      operation,
      durationMs,
      ...getMongoErrorDiagnostics(error),
    });

    return NextResponse.json(
      {
        error: {
          code: unavailable.code,
          message: unavailable.message,
          requestId,
        },
      },
      {
        status: unavailable.status,
        headers: { "x-request-id": requestId },
      },
    );
  }

  logger.error("Unexpected API request failure", {
    requestId,
    operation,
    durationMs,
    method: request.method,
    pathname: new URL(request.url).pathname,
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorCode:
      error instanceof Error && "code" in error ? String(error.code) : undefined,
  });

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again.",
        requestId,
      },
    },
    {
      status: 500,
      headers: { "x-request-id": requestId },
    },
  );
}
