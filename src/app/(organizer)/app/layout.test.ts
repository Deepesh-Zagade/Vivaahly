import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  getCurrentOrganizer: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/font/google", () => ({
  EB_Garamond: () => ({ variable: "font-editorial" }),
  Plus_Jakarta_Sans: () => ({ variable: "font-interface" }),
}));
vi.mock("@/modules/auth/auth.server", () => ({
  getCurrentOrganizer: mocks.getCurrentOrganizer,
}));

import OrganizerLayout from "@/app/(organizer)/app/layout";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((destination: string) => {
    throw new Error(`redirect:${destination}`);
  });
});

describe("organizer route protection", () => {
  it("redirects signed-out access for organizer routes to sign in", async () => {
    mocks.getCurrentOrganizer.mockResolvedValue(null);

    await expect(
      OrganizerLayout({ children: "Protected content" }),
    ).rejects.toThrow("redirect:/sign-in");
  });
});
