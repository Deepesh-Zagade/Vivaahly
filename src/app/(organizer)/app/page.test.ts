import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  requireCurrentOrganizer: vi.fn(),
  getWorkspaceWedding: vi.fn(),
  getOrganizerService: vi.fn(),
  getEventService: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/modules/auth/auth.server", () => ({
  requireCurrentOrganizer: mocks.requireCurrentOrganizer,
}));
vi.mock("@/app/(organizer)/app/_components/workspace-data.server", () => ({
  getWorkspaceWedding: mocks.getWorkspaceWedding,
}));
vi.mock("@/modules/organizers/organizer.server", () => ({
  getOrganizerService: mocks.getOrganizerService,
}));
vi.mock("@/modules/events/event.server", () => ({
  getEventService: mocks.getEventService,
}));

import OrganizerWorkspacePage from "@/app/(organizer)/app/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOrganizerService.mockResolvedValue({
    getOrganizerManagement: vi.fn().mockResolvedValue({ members: [] }),
  });
  mocks.getEventService.mockResolvedValue({
    listEvents: vi.fn().mockResolvedValue([]),
  });
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

    await expect(
      OrganizerWorkspacePage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect:/app/onboarding");
    expect(mocks.getWorkspaceWedding).not.toHaveBeenCalled();
  });

  it("loads the authoritative wedding for an organizer with membership", async () => {
    const membership = {
      id: "membership-1",
      weddingId: "wedding-1",
      role: "ADMIN",
    };
    const wedding = { counters: { eventCount: 0 } };
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWorkspaceWedding.mockResolvedValue(wedding);

    const markup = renderToStaticMarkup(
      await OrganizerWorkspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Welcome back, Deepesh");
    expect(markup).toContain("0 Guests");
    expect(mocks.getWorkspaceWedding).toHaveBeenCalledWith(membership);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("renders authoritative active organizers rather than sample people", async () => {
    const membership = {
      id: "membership-1",
      weddingId: "wedding-1",
      role: "ADMIN",
    };
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWorkspaceWedding.mockResolvedValue({ counters: { eventCount: 0 } });
    mocks.getOrganizerService.mockResolvedValue({
      getOrganizerManagement: vi.fn().mockResolvedValue({
        members: [{ id: "member-1", name: "Priya", role: "MANAGER" }],
      }),
    });

    const markup = renderToStaticMarkup(
      await OrganizerWorkspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Priya");
    expect(markup).toContain("1 active member");
  });

  it("renders persisted events in the dashboard event widgets", async () => {
    const membership = {
      id: "membership-1",
      weddingId: "wedding-1",
      role: "ADMIN",
    };
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWorkspaceWedding.mockResolvedValue({
      counters: { eventCount: 1 },
      timezone: "Asia/Kolkata",
    });
    mocks.getEventService.mockResolvedValue({
      listEvents: vi.fn().mockResolvedValue([
        {
          id: "event-1",
          title: { en: "Family Sangeet" },
          startAt: new Date("2027-02-14T13:00:00.000Z"),
          endAt: new Date("2027-02-14T17:30:00.000Z"),
          venue: {
            name: { en: "Royal Hall" },
            address: {},
          },
        },
      ]),
    });

    const markup = renderToStaticMarkup(
      await OrganizerWorkspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(markup).toContain("Family Sangeet");
    expect(markup).toContain("1 Active Event");
    expect(markup).toContain("Royal Hall");
  });

  it("confirms a successful wedding-details redirect", async () => {
    const membership = {
      id: "membership-1",
      weddingId: "wedding-1",
      role: "ADMIN",
    };
    mocks.requireCurrentOrganizer.mockResolvedValue({
      user: { id: "user-1", name: "Deepesh" },
      membership,
    });
    mocks.getWorkspaceWedding.mockResolvedValue({ counters: { eventCount: 0 } });

    const markup = renderToStaticMarkup(
      await OrganizerWorkspacePage({
        searchParams: Promise.resolve({
          notice: "wedding-details-updated",
        }),
      }),
    );

    expect(markup).toContain("Wedding details updated successfully");
    expect(markup).toContain('role="status"');
  });
});
