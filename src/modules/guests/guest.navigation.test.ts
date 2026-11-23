import { describe, expect, it } from "vitest";
import {
  addGuestDirectoryNotice,
  buildGuestDetailsHref,
  buildGuestDirectoryHref,
  buildGuestEditExitHref,
  normalizeGuestDirectoryReturnTo,
} from "@/modules/guests/guest.navigation";

describe("guest directory navigation", () => {
  it("preserves filters, page, and page size in a return URL", () => {
    const returnTo = buildGuestDirectoryHref({
      q: "Kulkarni",
      guestType: "FAMILY",
      tag: "VIP",
      page: 3,
      pageSize: 50,
    });

    expect(returnTo).toBe(
      "/app/guests?q=Kulkarni&guestType=FAMILY&tag=VIP&page=3&pageSize=50",
    );
    expect(buildGuestDetailsHref("guest-1", returnTo)).toContain(
      "returnTo=%2Fapp%2Fguests%3Fq%3DKulkarni",
    );
  });

  it("normalizes safe guest-directory return URLs and rejects redirects", () => {
    expect(
      normalizeGuestDirectoryReturnTo(
        "/app/guests?guestType=INDIVIDUAL&page=2&pageSize=100",
      ),
    ).toBe("/app/guests?guestType=INDIVIDUAL&page=2&pageSize=100");
    expect(normalizeGuestDirectoryReturnTo("https://example.com/app/guests"))
      .toBe("/app/guests");
    expect(normalizeGuestDirectoryReturnTo("//example.com/app/guests"))
      .toBe("/app/guests");
    expect(normalizeGuestDirectoryReturnTo("/app/events?page=2"))
      .toBe("/app/guests");
  });

  it("preserves invitation filters and pagination as a safe return URL", () => {
    expect(
      normalizeGuestDirectoryReturnTo(
        "/app/invitations?status=NEEDS_EVENTS&guestType=FAMILY&page=3&pageSize=50",
      ),
    ).toBe(
      "/app/invitations?status=NEEDS_EVENTS&guestType=FAMILY&page=3&pageSize=50",
    );
  });

  it("adds a notice without losing the return state", () => {
    expect(
      addGuestDirectoryNotice(
        "/app/guests?tag=VIP&page=4&pageSize=50",
        "guest-removed",
      ),
    ).toBe(
      "/app/guests?tag=VIP&page=4&pageSize=50&notice=guest-removed",
    );
  });

  it("returns to invitations without adding a guest-directory notice", () => {
    expect(
      addGuestDirectoryNotice(
        "/app/invitations?status=NEEDS_EVENTS&page=2",
        "guest-removed",
      ),
    ).toBe("/app/invitations?status=NEEDS_EVENTS&page=2");
  });

  it("exits invitation-launched editing directly to the preserved invitation list", () => {
    const returnTo =
      "/app/invitations?q=Kulkarni&status=NEEDS_EVENTS&guestType=FAMILY&page=3&pageSize=50";

    expect(buildGuestEditExitHref("guest-1", returnTo)).toBe(returnTo);
    expect(
      buildGuestEditExitHref(
        "guest-1",
        "/app/guests?tag=VIP&page=2&pageSize=50",
      ),
    ).toContain("/app/guests/guest-1?returnTo=");
  });
});
