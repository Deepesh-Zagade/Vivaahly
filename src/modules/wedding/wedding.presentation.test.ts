import { describe, expect, it } from "vitest";
import {
  coupleDisplayName,
  titleMatchesCoupleNames,
  weddingCountdown,
} from "@/modules/wedding/wedding.presentation";

describe("wedding presentation", () => {
  it("derives the primary workspace heading from the couple names", () => {
    expect(coupleDisplayName(" Deepesh ", " Priya ")).toBe(
      "Deepesh & Priya",
    );
  });

  it("recognizes a generated title despite harmless spacing and case changes", () => {
    expect(
      titleMatchesCoupleNames(
        "  DEEPESH   &  PRIYA ",
        "Deepesh",
        "Priya",
      ),
    ).toBe(true);
  });

  it("does not treat a custom wedding title as generated", () => {
    expect(
      titleMatchesCoupleNames("Our Forever Begins", "Deepesh", "Priya"),
    ).toBe(false);
  });

  it("calculates the wedding-day boundary in the wedding timezone", () => {
    const weddingDate = new Date("2027-02-14T00:00:00.000Z");
    const afterMidnightInKolkata = new Date("2027-02-13T19:00:00.000Z");

    expect(
      weddingCountdown(
        weddingDate,
        "Asia/Kolkata",
        afterMidnightInKolkata,
      ),
    ).toBe("Wedding day");
    expect(
      weddingCountdown(weddingDate, "UTC", afterMidnightInKolkata),
    ).toBe("Tomorrow");
  });
});
