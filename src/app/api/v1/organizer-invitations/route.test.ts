import { beforeEach, describe, expect, it, vi } from "vitest";
import { forbiddenError } from "@/server/http/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentOrganizer: vi.fn(),
  getOrganizerService: vi.fn(),
}));

vi.mock("@/modules/auth/auth.server", () => ({
  requireCurrentOrganizer: mocks.requireCurrentOrganizer,
}));
vi.mock("@/modules/organizers/organizer.server", () => ({
  getOrganizerService: mocks.getOrganizerService,
}));

import { GET, POST } from "@/app/api/v1/organizer-invitations/route";

const organizer = {
  user: {
    id: "690092d1b617241033eaa111",
    name: "Deepesh",
    email: "deepesh@example.com",
  },
  membership: {
    id: "690092d1b617241033eaa222",
    weddingId: "690092d1b617241033eaa333",
    role: "ADMIN" as const,
  },
};
const invitation = {
  id: "690092d1b617241033eaa444",
  email: "rahul@example.com",
  role: "MANAGER" as const,
  status: "PENDING" as const,
  expiresAt: new Date("2026-11-05T10:00:00.000Z"),
  createdAt: new Date("2026-10-29T10:00:00.000Z"),
};

function createRequest(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/v1/organizer-invitations", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentOrganizer.mockResolvedValue(organizer);
});

describe("organizer invitation routes", () => {
  it("creates an Admin-scoped invitation without accepting a wedding id", async () => {
    const createInvitation = vi.fn().mockResolvedValue(invitation);
    mocks.getOrganizerService.mockResolvedValue({ createInvitation });

    const response = await POST(
      createRequest({ email: "Rahul@Example.com", role: "MANAGER" }),
    );

    expect(response.status).toBe(201);
    expect(createInvitation).toHaveBeenCalledWith(organizer, {
      email: "rahul@example.com",
      role: "MANAGER",
    });
    const body = await response.json();
    expect(body.data.invitation).not.toHaveProperty("tokenHash");
  });

  it("rejects caller-supplied tenant fields and cross-origin mutations", async () => {
    const createInvitation = vi.fn();
    mocks.getOrganizerService.mockResolvedValue({ createInvitation });
    const invalid = await POST(
      createRequest({
        email: "rahul@example.com",
        role: "MANAGER",
        weddingId: "another-wedding",
      }),
    );
    expect(invalid.status).toBe(400);
    const crossOrigin = await POST(
      createRequest(
        { email: "rahul@example.com", role: "MANAGER" },
        "https://attacker.example",
      ),
    );
    expect(crossOrigin.status).toBe(403);
    expect(createInvitation).not.toHaveBeenCalled();
  });

  it("lists pending invitations for Admins and rejects Manager access", async () => {
    const getOrganizerManagement = vi
      .fn()
      .mockResolvedValueOnce({ canManage: true, invitations: [invitation] })
      .mockRejectedValueOnce(
        forbiddenError("Only wedding Admins can view organizer invitations."),
      );
    mocks.getOrganizerService.mockResolvedValue({ getOrganizerManagement });
    const first = await GET(new Request("http://localhost/api/v1/organizer-invitations"));
    expect(first.status).toBe(200);
    const second = await GET(new Request("http://localhost/api/v1/organizer-invitations"));
    expect(second.status).toBe(403);
  });
});
