import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { DELETE, PATCH } from "@/app/api/v1/members/[memberId]/route";

const organizer = {
  user: { id: "690092d1b617241033eaa111", name: "Deepesh" },
  membership: {
    id: "690092d1b617241033eaa222",
    weddingId: "690092d1b617241033eaa333",
    role: "ADMIN" as const,
  },
};
const memberId = "690092d1b617241033eaa444";
const context = { params: Promise.resolve({ memberId }) };

function patchRequest(body: unknown, origin = "http://localhost") {
  return new Request(`http://localhost/api/v1/members/${memberId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentOrganizer.mockResolvedValue(organizer);
});

describe("organizer member mutation routes", () => {
  it("changes a member role without accepting tenant fields", async () => {
    const updateMemberRole = vi.fn().mockResolvedValue({
      id: memberId,
      role: "ADMIN",
      status: "ACTIVE",
    });
    mocks.getOrganizerService.mockResolvedValue({ updateMemberRole });

    const response = await PATCH(patchRequest({ role: "ADMIN" }), context);

    expect(response.status).toBe(200);
    expect(updateMemberRole).toHaveBeenCalledWith(organizer, memberId, {
      role: "ADMIN",
    });
  });

  it("rejects caller-supplied wedding IDs and cross-origin mutations", async () => {
    const updateMemberRole = vi.fn();
    mocks.getOrganizerService.mockResolvedValue({ updateMemberRole });

    expect(
      (await PATCH(patchRequest({ role: "MANAGER", weddingId: "other" }), context))
        .status,
    ).toBe(400);
    expect(
      (await PATCH(patchRequest({ role: "MANAGER" }, "https://attacker.example"), context))
        .status,
    ).toBe(403);
    expect(updateMemberRole).not.toHaveBeenCalled();
  });

  it("removes a member through the authenticated organizer context", async () => {
    const removeMember = vi.fn().mockResolvedValue(undefined);
    mocks.getOrganizerService.mockResolvedValue({ removeMember });
    const request = new Request(`http://localhost/api/v1/members/${memberId}`, {
      method: "DELETE",
      headers: { origin: "http://localhost" },
    });

    const response = await DELETE(request, context);

    expect(response.status).toBe(204);
    expect(removeMember).toHaveBeenCalledWith(organizer, memberId);
  });
});
