import { beforeEach, describe, expect, it, vi } from "vitest";
import { unauthenticatedError } from "@/server/http/errors";

const mocks = vi.hoisted(() => ({
  getAuthService: vi.fn(),
  getWeddingService: vi.fn(),
}));

vi.mock("@/modules/auth/auth.server", () => ({
  getAuthService: mocks.getAuthService,
  ORGANIZER_SESSION_COOKIE: "vivaahly_organizer_session",
}));

vi.mock("@/modules/wedding/wedding.server", () => ({
  getWeddingService: mocks.getWeddingService,
}));

import { POST } from "@/app/api/v1/auth/login/route";

const user = {
  id: "690092d1b617241033eaa111",
  name: "Deepesh",
  email: "deepesh@example.com",
  emailNormalized: "deepesh@example.com",
  passwordHash: "not-returned",
  status: "ACTIVE" as const,
  createdAt: new Date("2026-10-27T08:00:00.000Z"),
  updatedAt: new Date("2026-10-27T08:00:00.000Z"),
};

const session = {
  rawToken: "a".repeat(43),
  expiresAt: new Date("2026-11-03T08:00:00.000Z"),
};

function loginRequest(password = "correct passphrase") {
  return new Request("http://localhost/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: user.email, password }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/auth/login", () => {
  it.each([
    ["without a wedding", null],
    [
      "with an active Admin membership",
      { id: "membership-admin", weddingId: "wedding-1", role: "ADMIN" },
    ],
    [
      "with an active Manager membership",
      { id: "membership-manager", weddingId: "wedding-1", role: "MANAGER" },
    ],
  ])("logs in %s", async (_label, membership) => {
    const authService = {
      verifyCredentials: vi.fn().mockResolvedValue(user),
      createSession: vi.fn().mockResolvedValue(session),
    };
    const weddingService = {
      findActiveMembershipForUser: vi.fn().mockResolvedValue(membership),
    };
    mocks.getAuthService.mockResolvedValue(authService);
    mocks.getWeddingService.mockResolvedValue(weddingService);

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        user: { id: user.id, name: user.name, email: user.email },
        membership,
      },
    });
    expect(response.headers.get("set-cookie")).toContain(
      "vivaahly_organizer_session=",
    );
    expect(authService.createSession).toHaveBeenCalledWith(user.id);
    expect(
      weddingService.findActiveMembershipForUser.mock.invocationCallOrder[0],
    ).toBeLessThan(authService.createSession.mock.invocationCallOrder[0]!);
  });

  it.each(["incorrect password", "unknown account"])(
    "returns 401 for an %s",
    async () => {
      const authService = {
        verifyCredentials: vi
          .fn()
          .mockRejectedValue(
            unauthenticatedError("Incorrect email address or password."),
          ),
        createSession: vi.fn(),
      };
      mocks.getAuthService.mockResolvedValue(authService);

      const response = await POST(loginRequest("incorrect password"));

      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(authService.createSession).not.toHaveBeenCalled();
    },
  );

  it("returns 503 without creating a session when membership lookup fails", async () => {
    const authService = {
      verifyCredentials: vi.fn().mockResolvedValue(user),
      createSession: vi.fn(),
    };
    const databaseError = Object.assign(new Error("No primary"), {
      name: "MongoServerSelectionError",
      reason: { type: "ReplicaSetNoPrimary" },
    });
    mocks.getAuthService.mockResolvedValue(authService);
    mocks.getWeddingService.mockResolvedValue({
      findActiveMembershipForUser: vi.fn().mockRejectedValue(databaseError),
    });

    const response = await POST(loginRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(authService.createSession).not.toHaveBeenCalled();
  });

  it("returns 503 and does not set a cookie when session insertion fails", async () => {
    const databaseError = Object.assign(new Error("No primary"), {
      name: "MongoServerSelectionError",
      reason: { type: "ReplicaSetNoPrimary" },
    });
    const authService = {
      verifyCredentials: vi.fn().mockResolvedValue(user),
      createSession: vi.fn().mockRejectedValue(databaseError),
    };
    mocks.getAuthService.mockResolvedValue(authService);
    mocks.getWeddingService.mockResolvedValue({
      findActiveMembershipForUser: vi.fn().mockResolvedValue(null),
    });

    const response = await POST(loginRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
