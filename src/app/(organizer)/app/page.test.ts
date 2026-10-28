import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  requireCurrentOrganizer: vi.fn(),
  getWeddingService: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/auth/auth.server", () => ({
  requireCurrentOrganizer: mocks.requireCurrentOrganizer,
}));
vi.mock("@/modules/wedding/wedding.server", () => ({
  getWeddingService: mocks.getWeddingService,
}));

import OrganizerWorkspacePage from "@/app/(organizer)/app/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((destination: string) => {
    throw new Error(`redirect:${destination}`);
  });
});

describe("organizer workspace routing", () => {
  it("redirects an organizer without a wedding to onboarding", async () => {
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership: null,
    });

    await expect(OrganizerWorkspacePage()).rejects.toThrow(
      "redirect:/app/onboarding",
    );
    expect(mocks.getWeddingService).not.toHaveBeenCalled();
  });

  it("loads the authoritative wedding for an organizer with membership", async () => {
    const membership = {
      id: "membership-1",
      weddingId: "wedding-1",
      role: "ADMIN",
    };
    const getWeddingForOrganizer = vi.fn().mockResolvedValue({
      title: { en: "Deepesh & Priya" },
      mainWeddingDate: new Date("2027-02-14T00:00:00.000Z"),
      primaryVenue: { city: { en: "Pune, Maharashtra" } },
      timezone: "Asia/Kolkata",
    });
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWeddingService.mockResolvedValue({ getWeddingForOrganizer });

    await expect(OrganizerWorkspacePage()).resolves.toBeDefined();
    expect(getWeddingForOrganizer).toHaveBeenCalledWith(membership);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
