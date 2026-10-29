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

import WeddingSettingsPage from "@/app/(organizer)/app/settings/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((destination: string) => {
    throw new Error(`redirect:${destination}`);
  });
});

describe("wedding settings routing", () => {
  it("redirects an organizer without a wedding to onboarding", async () => {
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership: null,
    });

    await expect(WeddingSettingsPage()).rejects.toThrow(
      "redirect:/app/onboarding",
    );
    expect(mocks.getWeddingService).not.toHaveBeenCalled();
  });

  it("loads the authoritative wedding and its editing state", async () => {
    const membership = {
      id: "membership-1",
      weddingId: "wedding-1",
      role: "ADMIN",
    };
    const wedding = {
      id: "wedding-1",
      slug: "deepesh-and-priya-14022027",
      couple: {
        bride: { name: { en: "Priya" } },
        groom: { name: { en: "Deepesh" } },
      },
      title: { en: "Deepesh & Priya" },
      mainWeddingDate: new Date("2027-02-14T00:00:00.000Z"),
      timezone: "Asia/Kolkata",
      primaryVenue: { city: { en: "Pune, Maharashtra" } },
      website: {
        themeId: "THEME_01",
        defaultLocale: "en",
        supportedLocales: ["en", "mr"],
        livestream: { enabled: false, youtubeUrl: null },
      },
    };
    const getWeddingForOrganizer = vi.fn().mockResolvedValue(wedding);
    const getWeddingEditingState = vi.fn().mockReturnValue({
      editable: true,
      today: "2026-10-28",
    });
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWeddingService.mockResolvedValue({
      getWeddingForOrganizer,
      getWeddingEditingState,
    });

    await expect(WeddingSettingsPage()).resolves.toBeDefined();
    expect(getWeddingForOrganizer).toHaveBeenCalledWith(membership);
    expect(getWeddingEditingState).toHaveBeenCalledWith(wedding);
  });
});
