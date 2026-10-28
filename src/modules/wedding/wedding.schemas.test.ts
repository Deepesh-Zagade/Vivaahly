import { describe, expect, it } from "vitest";
import { createWeddingSchema } from "@/modules/wedding/wedding.schemas";

const validInput = {
  couple: {
    bride: { name: { en: "Priya Sharma", mr: "प्रिया शर्मा" } },
    groom: { name: { en: "Deepesh Patil", mr: "दीपेश पाटील" } },
  },
  title: { en: "Deepesh & Priya" },
  mainWeddingDate: "2027-02-14",
  timezone: "Asia/Kolkata",
  primaryVenue: { city: { en: "Pune, Maharashtra" } },
};

describe("createWeddingSchema", () => {
  it("accepts the documented wedding onboarding payload", () => {
    expect(createWeddingSchema.parse(validInput)).toMatchObject(validInput);
  });

  it("allows Marathi names to be omitted", () => {
    const input = {
      ...validInput,
      couple: {
        bride: { name: { en: validInput.couple.bride.name.en } },
        groom: { name: { en: validInput.couple.groom.name.en } },
      },
    };

    expect(createWeddingSchema.safeParse(input).success).toBe(true);
  });

  it("trims organizer-authored text", () => {
    const input = structuredClone(validInput);
    input.couple.bride.name.en = "  Priya Sharma  ";
    input.primaryVenue.city.en = "  Pune, Maharashtra  ";

    const parsed = createWeddingSchema.parse(input);
    expect(parsed.couple.bride.name.en).toBe("Priya Sharma");
    expect(parsed.primaryVenue.city.en).toBe("Pune, Maharashtra");
  });

  it("rejects impossible calendar dates", () => {
    expect(
      createWeddingSchema.safeParse({
        ...validInput,
        mainWeddingDate: "2027-02-30",
      }).success,
    ).toBe(false);
  });

  it("rejects unsupported timezones", () => {
    expect(
      createWeddingSchema.safeParse({
        ...validInput,
        timezone: "India/Pune",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty city or location", () => {
    expect(
      createWeddingSchema.safeParse({
        ...validInput,
        primaryVenue: { city: { en: "   " } },
      }).success,
    ).toBe(false);
  });
});
