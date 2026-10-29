import { describe, expect, it } from "vitest";
import {
  changedWeddingFieldError,
  type WeddingSettingsFormValues,
} from "@/app/(organizer)/app/settings/wedding-settings.validation";

const values: WeddingSettingsFormValues = {
  brideNameEn: "Priya",
  brideNameMr: "",
  groomNameEn: "Deepesh",
  groomNameMr: "",
  titleEn: "Our Forever Begins",
  mainWeddingDate: "2027-02-14",
  timezone: "Asia/Kolkata",
  cityEn: "Pune, Maharashtra",
};

describe("wedding settings field validation", () => {
  it("keeps an error while the changed field is still invalid", () => {
    expect(
      changedWeddingFieldError(
        { ...values, titleEn: "" },
        "titleEn",
        "2026-10-29",
      ),
    ).toBe("Wedding title must contain at least 2 characters.");
  });

  it("clears the error once the changed field becomes valid", () => {
    expect(
      changedWeddingFieldError(values, "titleEn", "2026-10-29"),
    ).toBeUndefined();
  });

  it("keeps the date error until the date reaches the allowed minimum", () => {
    expect(
      changedWeddingFieldError(
        { ...values, mainWeddingDate: "2026-10-28" },
        "mainWeddingDate",
        "2026-10-29",
      ),
    ).toBe("Choose today or a future wedding date.");
    expect(
      changedWeddingFieldError(
        { ...values, mainWeddingDate: "2026-10-29" },
        "mainWeddingDate",
        "2026-10-29",
      ),
    ).toBeUndefined();
  });
});
