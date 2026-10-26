import { describe, expect, it } from "vitest";
import { getOrganizerPasswordError } from "@/modules/auth/password-policy";

describe("organizer password policy", () => {
  it.each([
    ["", "Password is required."],
    [" ".repeat(12), "Password cannot contain only spaces."],
    ["short words", "Password must contain at least 12 characters."],
    ["a".repeat(129), "Password must contain at most 128 characters."],
    ["wedding\tplans", "Password may contain regular spaces only."],
    [" wedding plans", "Password cannot begin or end with a space."],
    ["wedding plans ", "Password cannot begin or end with a space."],
    ["wedding  plans", "Use only one space between words."],
  ])("rejects %j with a precise message", (password, message) => {
    expect(getOrganizerPasswordError(password)).toBe(message);
  });

  it.each([
    "simple words",
    "alllowercasephrase",
    "Memorable phrase 2026!",
  ])("accepts %j", (password) => {
    expect(getOrganizerPasswordError(password)).toBeNull();
  });
});
