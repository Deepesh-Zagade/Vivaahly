import { describe, expect, it } from "vitest";
import {
  loginOrganizerSchema,
  registerOrganizerSchema,
} from "@/modules/auth/auth.schemas";

describe("organizer authentication schemas", () => {
  it("normalizes registration names and email addresses", () => {
    const result = registerOrganizerSchema.parse({
      name: "  Rahul    Sharma  ",
      email: "  RAHUL@Example.COM ",
      password: "a long wedding passphrase",
    });

    expect(result).toEqual({
      name: "Rahul Sharma",
      email: "rahul@example.com",
      password: "a long wedding passphrase",
    });
  });

  it("applies the organizer password policy during registration", () => {
    const result = registerOrganizerSchema.safeParse({
      name: "Rahul Sharma",
      email: "rahul@example.com",
      password: "wedding  plans",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toEqual([
        "Use only one space between words.",
      ]);
    }
  });

  it("normalizes login emails without applying signup length rules to passwords", () => {
    const result = loginOrganizerSchema.parse({
      email: " Rahul@Example.com ",
      password: "existing-password",
    });

    expect(result.email).toBe("rahul@example.com");
  });
});
