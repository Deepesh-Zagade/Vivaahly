import { describe, expect, it } from "vitest";
import { weddingDetailsSetFields } from "@/modules/wedding/repositories/mongodb-wedding.repository";

describe("Mongo wedding detail updates", () => {
  it("updates localized and venue fields at leaf paths", () => {
    const fields = weddingDetailsSetFields({
      couple: {
        bride: { name: { en: "Priya", mr: "प्रिया" } },
        groom: { name: { en: "Deepesh", mr: "दीपेश" } },
      },
      titleEn: "Our Forever Begins",
      mainWeddingDate: new Date("2027-02-14T00:00:00.000Z"),
      timezone: "Asia/Kolkata",
      primaryVenueCityEn: "Pune, Maharashtra",
      updatedAt: new Date("2026-10-29T08:00:00.000Z"),
    });

    expect(fields).toMatchObject({
      "title.en": "Our Forever Begins",
      "primaryVenue.city.en": "Pune, Maharashtra",
    });
    expect(fields).not.toHaveProperty("title");
    expect(fields).not.toHaveProperty("primaryVenue");
  });
});
