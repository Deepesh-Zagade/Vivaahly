import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthService: vi.fn(),
}));

vi.mock("@/modules/auth/auth.server", () => ({
  getAuthService: mocks.getAuthService,
  ORGANIZER_SESSION_COOKIE: "vivaahly_organizer_session",
}));

import { POST } from "@/app/api/v1/auth/logout/route";

function logoutRequest() {
  return new NextRequest("http://localhost/api/v1/auth/logout", {
    method: "POST",
    headers: {
      origin: "http://localhost",
      cookie: "vivaahly_organizer_session=session-token",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/auth/logout", () => {
  it("revokes the session and clears the cookie", async () => {
    const authService = { logout: vi.fn().mockResolvedValue(undefined) };
    mocks.getAuthService.mockResolvedValue(authService);

    const response = await POST(logoutRequest());

    expect(response.status).toBe(204);
    expect(authService.logout).toHaveBeenCalledWith("session-token");
    expect(response.headers.get("set-cookie")).toContain(
      "vivaahly_organizer_session=",
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns 503 without clearing the cookie when revocation cannot reach MongoDB", async () => {
    const databaseError = Object.assign(new Error("No primary"), {
      name: "MongoServerSelectionError",
      reason: { type: "ReplicaSetNoPrimary" },
    });
    mocks.getAuthService.mockResolvedValue({
      logout: vi.fn().mockRejectedValue(databaseError),
    });

    const response = await POST(logoutRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "SERVICE_UNAVAILABLE" },
    });
  });
});
