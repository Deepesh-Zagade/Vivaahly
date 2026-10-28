import { describe, expect, it } from "vitest";
import type { CreateWeddingInput } from "@/modules/wedding/wedding.schemas";
import {
  ActiveWeddingMembershipError,
  DuplicateMediaAccessKeyError,
  type CreateWeddingRecord,
  type WeddingRepository,
} from "@/modules/wedding/wedding.repository";
import {
  generateWeddingSlug,
  WeddingService,
} from "@/modules/wedding/wedding.service";
import type {
  Wedding,
  WeddingMembership,
} from "@/modules/wedding/wedding.types";

const now = new Date("2026-10-27T10:00:00.000Z");
const input: CreateWeddingInput = {
  couple: {
    bride: { name: { en: "Priya Sharma", mr: "प्रिया शर्मा" } },
    groom: { name: { en: "Deepesh Patil", mr: "दीपेश पाटील" } },
  },
  title: { en: "Deepesh & Priya" },
  mainWeddingDate: "2027-02-14",
  timezone: "Asia/Kolkata",
  primaryVenue: { city: { en: "Pune, Maharashtra" } },
};

class FakeWeddingRepository implements WeddingRepository {
  weddings: Wedding[] = [];
  memberships: WeddingMembership[] = [];
  mediaCollisionOnce = false;

  async findActiveMembershipByUserId(userId: string) {
    return (
      this.memberships.find(
        (membership) =>
          membership.userId === userId && membership.status === "ACTIVE",
      ) ?? null
    );
  }

  async findWeddingById(weddingId: string) {
    return this.weddings.find((wedding) => wedding.id === weddingId) ?? null;
  }

  async createWeddingWithAdminMembership(record: CreateWeddingRecord) {
    if (await this.findActiveMembershipByUserId(record.userId)) {
      throw new ActiveWeddingMembershipError();
    }

    if (this.mediaCollisionOnce) {
      this.mediaCollisionOnce = false;
      throw new DuplicateMediaAccessKeyError();
    }

    const wedding: Wedding = {
      id: `wedding-${this.weddings.length + 1}`,
      slug: record.slug,
      status: "ACTIVE",
      couple: record.couple,
      title: record.title,
      mainWeddingDate: record.mainWeddingDate,
      timezone: record.timezone,
      primaryVenue: record.primaryVenue,
      website: {
        themeId: "THEME_01",
        defaultLocale: "en",
        supportedLocales: ["en", "mr"],
        livestream: { enabled: false, youtubeUrl: null },
      },
      mediaAccessKey: record.mediaAccessKey,
      counters: { eventCount: 0 },
      createdByUserId: record.userId,
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
    };
    const membership: WeddingMembership = {
      id: `membership-${this.memberships.length + 1}`,
      weddingId: wedding.id,
      userId: record.userId,
      role: "ADMIN",
      status: "ACTIVE",
      joinedAt: record.createdAt,
      removedAt: null,
      createdAt: record.createdAt,
      updatedAt: record.createdAt,
    };
    this.weddings.push(wedding);
    this.memberships.push(membership);
    return { wedding, membership };
  }
}

function createService(repository = new FakeWeddingRepository()) {
  let keyNumber = 0;
  return {
    repository,
    service: new WeddingService({
      repository,
      now: () => now,
      createMediaAccessKey: () => `media-key-${++keyNumber}`,
    }),
  };
}

describe("WeddingService", () => {
  it("generates the documented readable date-based slug", () => {
    expect(generateWeddingSlug(input)).toBe("deepesh-patil-and-priya-sharma-14022027");
  });

  it("creates the wedding and initial Admin membership together", async () => {
    const { service } = createService();
    const result = await service.createWedding("user-1", input);

    expect(result.wedding).toMatchObject({
      slug: "deepesh-patil-and-priya-sharma-14022027",
      mediaAccessKey: "media-key-1",
      primaryVenue: { city: { en: "Pune, Maharashtra" } },
    });
    expect(result.membership).toMatchObject({
      userId: "user-1",
      weddingId: result.wedding.id,
      role: "ADMIN",
      status: "ACTIVE",
    });
  });

  it("derives the optional Marathi title from both Marathi names", async () => {
    const { service } = createService();
    const result = await service.createWedding("user-1", input);

    expect(result.wedding.title.mr).toBe("दीपेश पाटील आणि प्रिया शर्मा");
  });

  it("rejects a wedding date before today in the selected timezone", async () => {
    const { service } = createService();

    await expect(
      service.createWedding("user-1", {
        ...input,
        mainWeddingDate: "2026-10-26",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR", status: 400 });
  });

  it("accepts a wedding taking place today", async () => {
    const { service } = createService();

    await expect(
      service.createWedding("user-1", {
        ...input,
        mainWeddingDate: "2026-10-27",
      }),
    ).resolves.toBeDefined();
  });

  it("returns a conflict when the organizer already has an active wedding", async () => {
    const { service } = createService();
    await service.createWedding("user-1", input);

    await expect(service.createWedding("user-1", input)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("regenerates the media access key after the improbable first collision", async () => {
    const repository = new FakeWeddingRepository();
    repository.mediaCollisionOnce = true;
    const { service } = createService(repository);
    const result = await service.createWedding("user-1", input);

    expect(result.wedding.mediaAccessKey).toBe("media-key-2");
  });

  it("resolves active membership and the authoritative wedding", async () => {
    const { service } = createService();
    const created = await service.createWedding("user-1", input);
    const membership = await service.findActiveMembershipForUser("user-1");

    expect(membership).toEqual({
      id: created.membership.id,
      weddingId: created.wedding.id,
      role: "ADMIN",
    });
    await expect(
      service.getWeddingForOrganizer(membership!),
    ).resolves.toMatchObject({ id: created.wedding.id });
  });

  it("does not expose a nonexistent wedding through a membership context", async () => {
    const { service } = createService();

    await expect(
      service.getWeddingForOrganizer({
        id: "membership-missing",
        weddingId: "wedding-missing",
        role: "ADMIN",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });
});
