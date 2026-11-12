import { describe, expect, it } from "vitest";
import { createEventSchema } from "@/modules/events/event.schemas";

const validInput = {
  title: { en: "Sangeet" },
  description: {},
  startAt: "2027-02-14T13:00:00.000Z",
  endAt: "2027-02-14T17:30:00.000Z",
  venue: { name: {}, address: {} },
  dressCode: {},
};

describe("event schemas", () => {
  it("accepts the documented minimal event input", () => {
    expect(createEventSchema.safeParse(validInput).success).toBe(true);
  });

  it("requires the end instant to be later than the start instant", () => {
    const result = createEventSchema.safeParse({
      ...validInput,
      endAt: validInput.startAt,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["endAt"],
        message: "End time must be later than the start time.",
      });
    }
  });

  it("accepts an event that ends after midnight", () => {
    expect(
      createEventSchema.safeParse({
        ...validInput,
        startAt: "2027-02-14T16:30:00.000Z",
        endAt: "2027-02-14T19:30:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejects insecure map links", () => {
    expect(
      createEventSchema.safeParse({
        ...validInput,
        venue: { ...validInput.venue, mapUrl: "http://example.com/place" },
      }).success,
    ).toBe(false);
  });
});
