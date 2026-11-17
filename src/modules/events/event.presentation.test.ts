import { describe, expect, it } from "vitest";
import { formatEventTimeRange } from "@/modules/events/event.presentation";

describe("formatEventTimeRange", () => {
  it("can omit the timezone suffix for compact guest displays", () => {
    const value = formatEventTimeRange(
      new Date("2026-12-14T05:30:00.000Z"),
      new Date("2026-12-14T09:30:00.000Z"),
      "Asia/Kolkata",
      false,
    );

    expect(value).toContain("11:00 am");
    expect(value).toContain("3:00 pm");
    expect(value).not.toMatch(/IST|GMT|Asia\/Kolkata/u);
  });
});
