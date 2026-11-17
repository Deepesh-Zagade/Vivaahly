import { describe, expect, it } from "vitest";
import { paginationItems } from "@/modules/guests/guest.pagination";

describe("paginationItems", () => {
  it("shows every page for short result sets", () => {
    expect(paginationItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses ellipses around a middle page", () => {
    expect(paginationItems(10, 38)).toEqual([
      1,
      "ellipsis-left",
      9,
      10,
      11,
      "ellipsis-right",
      38,
    ]);
  });

  it("keeps useful neighbours at the beginning and end", () => {
    expect(paginationItems(1, 38)).toEqual([1, 2, 3, "ellipsis-right", 38]);
    expect(paginationItems(38, 38)).toEqual([
      1,
      "ellipsis-left",
      36,
      37,
      38,
    ]);
  });
});
