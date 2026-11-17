import { describe, expect, it } from "vitest";
import {
  assignGuestEventsSchema,
  guestInputSchema,
  guestListQuerySchema,
} from "@/modules/guests/guest.schemas";

const validGuest = {
  guestType: "FAMILY" as const,
  displayName: { en: "Kulkarni Family", mr: "कुलकर्णी परिवार" },
  primaryContact: {
    name: { en: "Rajesh Kulkarni" },
    email: "RAJESH@example.com",
    phone: "+91 (98201) 44521",
  },
  tags: ["GROOM_SIDE", "RELATIVES"] as const,
  organizerNotes: "Primary family contact",
};

describe("guest schemas", () => {
  it("accepts a family guest and normalizes the optional email", () => {
    const result = guestInputSchema.safeParse(validGuest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primaryContact.email).toBe("rajesh@example.com");
    }
  });

  it("accepts an individual without email or phone", () => {
    expect(
      guestInputSchema.safeParse({
        guestType: "INDIVIDUAL",
        displayName: { en: "Ananya Sen" },
        primaryContact: { name: { en: "Ananya Sen" } },
        tags: ["BRIDE_SIDE", "FRIENDS"],
      }).success,
    ).toBe(true);
  });

  it("rejects invalid international contact numbers", () => {
    const result = guestInputSchema.safeParse({
      ...validGuest,
      primaryContact: { ...validGuest.primaryContact, phone: "12-34" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["primaryContact", "phone"]);
    }
  });

  it("rejects duplicate tags and duplicate event assignments", () => {
    expect(
      guestInputSchema.safeParse({
        ...validGuest,
        tags: ["VIP", "VIP"],
      }).success,
    ).toBe(false);
    const eventId = "690092d1b617241033eaa444";
    expect(
      assignGuestEventsSchema.safeParse({ eventIds: [eventId, eventId] })
        .success,
    ).toBe(false);
  });

  it("coerces bounded pagination filters", () => {
    expect(
      guestListQuerySchema.parse({ page: "2", pageSize: "50" }),
    ).toMatchObject({ page: 2, pageSize: 50 });
    expect(
      guestListQuerySchema.parse({ page: "2", pageSize: "100" }),
    ).toMatchObject({ page: 2, pageSize: 100 });
    expect(
      guestListQuerySchema.safeParse({ page: "1", pageSize: "101" }).success,
    ).toBe(false);
    expect(
      guestListQuerySchema.safeParse({ page: "1", pageSize: "25" }).success,
    ).toBe(false);
  });

  it("treats empty HTML form filter values as absent", () => {
    expect(
      guestListQuerySchema.parse({
        q: "",
        guestType: "INDIVIDUAL",
        tag: "",
        eventId: "",
      }),
    ).toMatchObject({
      guestType: "INDIVIDUAL",
      page: 1,
      pageSize: 10,
    });
  });
});
