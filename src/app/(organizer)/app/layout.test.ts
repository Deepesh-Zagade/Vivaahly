import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  getCurrentOrganizer: vi.fn(),
  getWorkspaceWedding: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/font/google", () => ({
  EB_Garamond: () => ({ variable: "font-editorial" }),
  Plus_Jakarta_Sans: () => ({ variable: "font-interface" }),
}));
vi.mock("@/modules/auth/auth.server", () => ({
  getCurrentOrganizer: mocks.getCurrentOrganizer,
}));
vi.mock("@/app/(organizer)/app/_components/workspace-data.server", () => ({
  getWorkspaceWedding: mocks.getWorkspaceWedding,
}));
vi.mock("@/app/(organizer)/app/_components/workspace-shell", () => ({
  WorkspaceShell: ({ children, organizer, wedding }: { children: string; organizer: { name: string; role: string }; wedding: { eyebrow: string; coupleName: string } }) =>
    `${wedding.eyebrow}|${wedding.coupleName}|${organizer.name}|${organizer.role}|${children}`,
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

  it("loads the wedding shell and keeps custom title secondary to couple names", async () => {
    const membership = { id: "member-1", weddingId: "wedding-1", role: "ADMIN" };
    mocks.getCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWorkspaceWedding.mockResolvedValue({
      couple: {
        bride: { name: { en: "Priya" } },
        groom: { name: { en: "Deepesh" } },
      },
      title: { en: "Our Forever Begins" },
      mainWeddingDate: new Date("2027-02-14T00:00:00.000Z"),
      timezone: "Asia/Kolkata",
      primaryVenue: { city: { en: "Pune, Maharashtra" } },
    });

    const markup = renderToStaticMarkup(
      await OrganizerLayout({ children: "Dashboard content" }),
    );

    expect(markup).toContain("Our Forever Begins|Deepesh &amp; Priya");
    expect(mocks.getWorkspaceWedding).toHaveBeenCalledWith(membership);
  });
});
