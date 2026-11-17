import { describe, expect, it } from "vitest";
import {
  addGuestDirectoryNotice,
  buildGuestDetailsHref,
  buildGuestDirectoryHref,
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
});
