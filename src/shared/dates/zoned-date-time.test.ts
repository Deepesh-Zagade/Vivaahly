import { describe, expect, it } from "vitest";
import {
  dateTimePartsInTimezone,
  zonedDateTimeToIso,
} from "@/shared/dates/zoned-date-time";

describe("zoned date-time helpers", () => {
  it("converts an Indian wedding-local time to UTC", () => {
    expect(
      zonedDateTimeToIso("2027-02-14", "18:30", "Asia/Kolkata"),
    ).toBe("2027-02-14T13:00:00.000Z");
  });

  it("round trips a UTC instant in the wedding timezone", () => {
    expect(
      dateTimePartsInTimezone(
        new Date("2027-02-14T13:00:00.000Z"),
        "Asia/Kolkata",
      ),
    ).toEqual({ date: "2027-02-14", time: "18:30" });
  });

  it("rejects a malformed local date or time", () => {
    expect(zonedDateTimeToIso("bad", "18:30", "Asia/Kolkata")).toBeNull();
    expect(zonedDateTimeToIso("2027-02-14", "29:30", "Asia/Kolkata")).toBeNull();
  });
});
