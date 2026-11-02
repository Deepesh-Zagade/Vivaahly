import { describe, expect, it, vi } from "vitest";
import { apiErrorResponse } from "@/server/http/api";
import { logger } from "@/server/observability/logger";

describe("apiErrorResponse", () => {
  it("maps unavailable MongoDB topology errors to a controlled 503", async () => {
    const log = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const error = Object.assign(new Error("No primary available"), {
      name: "MongoServerSelectionError",
      code: "ETIMEDOUT",
      reason: { type: "ReplicaSetNoPrimary" },
    });
    const request = new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
    });

    const response = apiErrorResponse(error, request, "req-test", {
      operation: "organizer.login",
      startedAt: Date.now() - 25,
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message:
          "Vivaahly is temporarily unable to connect to the database. Please try again shortly.",
        requestId: "req-test",
      },
    });
    expect(log).toHaveBeenCalledWith(
      "MongoDB operation unavailable",
      expect.objectContaining({
        requestId: "req-test",
        operation: "organizer.login",
        mongoErrorName: "MongoServerSelectionError",
        mongoErrorCode: "ETIMEDOUT",
        topologyState: "ReplicaSetNoPrimary",
        durationMs: expect.any(Number),
      }),
    );

    log.mockRestore();
  });

  it("redacts organizer invitation tokens from unexpected-error logs", () => {
    const log = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const rawToken = "secret-invitation-token";
    const request = new Request(
      `http://localhost/api/v1/organizer-invitations/access/${rawToken}/accept`,
      { method: "POST" },
    );

    const response = apiErrorResponse(
      new Error("Unexpected failure"),
      request,
      "req-redaction",
    );

    expect(response.status).toBe(500);
    expect(log).toHaveBeenCalledWith(
      "Unexpected API request failure",
      expect.objectContaining({
        operation:
          "POST /api/v1/organizer-invitations/access/[token]/accept",
        pathname: "/api/v1/organizer-invitations/access/[token]/accept",
      }),
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(rawToken);

    log.mockRestore();
  });
});
