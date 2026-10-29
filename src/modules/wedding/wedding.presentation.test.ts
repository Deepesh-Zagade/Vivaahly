import { describe, expect, it } from "vitest";
import {
  coupleDisplayName,
  titleMatchesCoupleNames,
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
});
