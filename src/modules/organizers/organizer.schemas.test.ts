import { describe, expect, it } from "vitest";
import {
  acceptOrganizerInvitationSchema,
  createOrganizerInvitationSchema,
  updateOrganizerMemberSchema,
} from "@/modules/organizers/organizer.schemas";

describe("organizer invitation schemas", () => {
  it("normalizes invitation email and accepts supported roles", () => {
    expect(
      createOrganizerInvitationSchema.parse({
        email: "  Family.Member@Example.COM ",
        role: "MANAGER",
      }),
    ).toEqual({ email: "family.member@example.com", role: "MANAGER" });
  });

  it("rejects unknown fields and unsupported roles", () => {
    expect(
      createOrganizerInvitationSchema.safeParse({
        email: "family@example.com",
        role: "OWNER",
        weddingId: "caller-controlled",
      }).success,
    ).toBe(false);
  });

  it("accepts only supported organizer role updates", () => {
    expect(updateOrganizerMemberSchema.parse({ role: "ADMIN" })).toEqual({
      role: "ADMIN",
    });
    expect(updateOrganizerMemberSchema.safeParse({ role: "OWNER" }).success).toBe(false);
    expect(
      updateOrganizerMemberSchema.safeParse({ role: "MANAGER", weddingId: "unsafe" })
        .success,
    ).toBe(false);
  });

  it("requires name and password together for a new invited account", () => {
    expect(
      acceptOrganizerInvitationSchema.safeParse({ name: "Rahul Sharma" }).success,
    ).toBe(false);
    expect(
      acceptOrganizerInvitationSchema.safeParse({
        name: "Rahul Sharma",
        password: "wedding plans forever",
      }).success,
    ).toBe(true);
  });

  it("applies the organizer password whitespace policy", () => {
    expect(
      acceptOrganizerInvitationSchema.safeParse({
        name: "Rahul Sharma",
        password: "wedding  plans forever",
      }).success,
    ).toBe(false);
    expect(
      acceptOrganizerInvitationSchema.safeParse({
        name: "Rahul Sharma",
        password: "            ",
      }).success,
    ).toBe(false);
  });
});
