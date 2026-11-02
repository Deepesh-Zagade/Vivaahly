import { beforeEach, describe, expect, it, vi } from "vitest";
import { conflictError } from "@/server/http/errors";

const mocks = vi.hoisted(() => ({
  getCurrentOrganizer: vi.fn(),
  getOrganizerService: vi.fn(),
}));

vi.mock("@/modules/auth/auth.server", () => ({
  getCurrentOrganizer: mocks.getCurrentOrganizer,
  ORGANIZER_SESSION_COOKIE: "vivaahly_session",
}));
vi.mock("@/modules/organizers/organizer.server", () => ({
  getOrganizerService: mocks.getOrganizerService,
}));

import { POST } from "@/app/api/v1/organizer-invitations/access/[token]/accept/route";

const accepted = {
  result: {
    user: {
      id: "690092d1b617241033eaa111",
      name: "Rahul Sharma",
      email: "rahul@example.com",
    },
    membership: {
      id: "690092d1b617241033eaa222",
      weddingId: "690092d1b617241033eaa333",
      userId: "690092d1b617241033eaa111",
      role: "MANAGER" as const,
      status: "ACTIVE" as const,
      joinedAt: new Date(),
      removedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  session: {
    rawToken: "s".repeat(43),
    expiresAt: new Date(Date.now() + 86_400_000),
  },
};

function request(body: unknown = {}) {
  return new Request("http://localhost/api/v1/organizer-invitations/access/raw/accept", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentOrganizer.mockResolvedValue(null);
});

describe("POST organizer invitation acceptance", () => {
  it("creates a session cookie when a new invited account joins", async () => {
    const acceptInvitation = vi.fn().mockResolvedValue(accepted);
    mocks.getOrganizerService.mockResolvedValue({ acceptInvitation });

    const response = await POST(
      request({ name: "Rahul Sharma", password: "wedding plans forever" }),
      { params: Promise.resolve({ token: "raw-token" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("vivaahly_session=");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(acceptInvitation).toHaveBeenCalledWith(
      "raw-token",
      null,
      { name: "Rahul Sharma", password: "wedding plans forever" },
    );
  });

  it("does not create a second session for an already signed-in invitee", async () => {
    const acceptInvitation = vi.fn().mockResolvedValue({ ...accepted, session: null });
    const current = { user: accepted.result.user, membership: null };
    mocks.getCurrentOrganizer.mockResolvedValue(current);
    mocks.getOrganizerService.mockResolvedValue({ acceptInvitation });

    const response = await POST(request(), {
      params: Promise.resolve({ token: "raw-token" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(acceptInvitation).toHaveBeenCalledWith("raw-token", current, {});
  });

  it("returns a controlled 409 for an account mismatch", async () => {
    mocks.getOrganizerService.mockResolvedValue({
      acceptInvitation: vi.fn().mockRejectedValue(
        conflictError("Sign in using the invited email.", {
          reason: "ACCOUNT_MISMATCH",
        }),
      ),
    });
    const response = await POST(request(), {
      params: Promise.resolve({ token: "raw-token" }),
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "CONFLICT", details: { reason: "ACCOUNT_MISMATCH" } },
    });
  });

  it("rejects cross-origin acceptance before invoking the service", async () => {
    const acceptInvitation = vi.fn();
    mocks.getOrganizerService.mockResolvedValue({ acceptInvitation });
    const hostile = new Request(
      "http://localhost/api/v1/organizer-invitations/access/raw/accept",
      {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://attacker.example" },
        body: "{}",
      },
    );
    const response = await POST(hostile, {
      params: Promise.resolve({ token: "raw-token" }),
    });
    expect(response.status).toBe(403);
    expect(acceptInvitation).not.toHaveBeenCalled();
  });
});
