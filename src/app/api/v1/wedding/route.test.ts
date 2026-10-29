import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentOrganizer: vi.fn(),
  getWeddingService: vi.fn(),
}));

vi.mock("@/modules/auth/auth.server", () => ({
  requireCurrentOrganizer: mocks.requireCurrentOrganizer,
}));
vi.mock("@/modules/wedding/wedding.server", () => ({
  getWeddingService: mocks.getWeddingService,
}));

import { PATCH } from "@/app/api/v1/wedding/route";

const membership = {
  id: "membership-1",
  weddingId: "690092d1b617241033eaa222",
  role: "ADMIN" as const,
};
const organizer = {
  user: {
    id: "690092d1b617241033eaa111",
    name: "Deepesh",
    email: "deepesh@example.com",
  },
  membership,
};
const input = {
  couple: {
    bride: { name: { en: "Priya Sharma", mr: "प्रिया शर्मा" } },
    groom: { name: { en: "Deepesh Patil", mr: "दीपेश पाटील" } },
  },
  title: { en: "Deepesh & Priya" },
  mainWeddingDate: "2027-02-14",
  timezone: "Asia/Kolkata",
  primaryVenue: { city: { en: "Pune, Maharashtra" } },
};
const wedding = {
  id: membership.weddingId,
  slug: "deepesh-patil-and-priya-sharma-14022027",
  status: "ACTIVE" as const,
  couple: input.couple,
  title: { en: input.title.en, mr: "दीपेश पाटील आणि प्रिया शर्मा" },
  mainWeddingDate: new Date("2027-02-14T00:00:00.000Z"),
  timezone: input.timezone,
  primaryVenue: input.primaryVenue,
  website: {
    themeId: "THEME_01" as const,
    defaultLocale: "en" as const,
    supportedLocales: ["en", "mr"] as Array<"en" | "mr">,
    livestream: { enabled: false as const, youtubeUrl: null },
  },
  mediaAccessKey: "never-returned",
  counters: { eventCount: 0 },
  createdByUserId: organizer.user.id,
  createdAt: new Date("2026-10-27T08:00:00.000Z"),
  updatedAt: new Date("2026-10-28T08:00:00.000Z"),
};

function updateRequest(body: unknown = input, origin = "http://localhost") {
  return new Request("http://localhost/api/v1/wedding", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCurrentOrganizer.mockResolvedValue(organizer);
});

describe("PATCH /api/v1/wedding", () => {
  it("updates the authenticated organizer's wedding without a client wedding id", async () => {
    const updateWedding = vi.fn().mockResolvedValue(wedding);
    mocks.getWeddingService.mockResolvedValue({ updateWedding });

    const response = await PATCH(updateRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        wedding: {
          id: wedding.id,
          slug: wedding.slug,
          mainWeddingDate: "2027-02-14",
          primaryVenue: input.primaryVenue,
        },
      },
    });
    expect(updateWedding).toHaveBeenCalledWith(membership, input);
  });

  it("rejects immutable or caller-supplied tenant fields", async () => {
    const updateWedding = vi.fn();
    mocks.getWeddingService.mockResolvedValue({ updateWedding });

    const response = await PATCH(
      updateRequest({ ...input, weddingId: "another-wedding" }),
    );

    expect(response.status).toBe(400);
    expect(updateWedding).not.toHaveBeenCalled();
  });

  it("requires an active wedding membership", async () => {
    mocks.requireCurrentOrganizer.mockResolvedValue({
      ...organizer,
      membership: null,
    });

    const response = await PATCH(updateRequest());

    expect(response.status).toBe(409);
    expect(mocks.getWeddingService).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin mutation", async () => {
    const response = await PATCH(updateRequest(input, "https://attacker.example"));

    expect(response.status).toBe(403);
    expect(mocks.requireCurrentOrganizer).not.toHaveBeenCalled();
  });

  it("returns 503 for a sustained database failure", async () => {
    const databaseError = Object.assign(new Error("No primary"), {
      name: "MongoServerSelectionError",
      reason: { type: "ReplicaSetNoPrimary" },
    });
    mocks.getWeddingService.mockResolvedValue({
      updateWedding: vi.fn().mockRejectedValue(databaseError),
    });

    const response = await PATCH(updateRequest());

    expect(response.status).toBe(503);
  });
});
