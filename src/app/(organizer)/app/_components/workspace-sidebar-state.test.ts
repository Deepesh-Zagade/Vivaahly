import { describe, expect, it } from "vitest";
import {
  isSidebarEffectivelyExpanded,
  type SidebarMode,
} from "@/app/(organizer)/app/_components/workspace-sidebar-state";

describe("workspace sidebar responsive state", () => {
  it.each<[SidebarMode, boolean, boolean]>([
    ["default", false, false],
    ["default", true, true],
    ["expanded", false, true],
    ["expanded", true, true],
    ["collapsed", false, false],
    ["collapsed", true, false],
  ])(
    "treats %s mode at wideViewport=%s as expanded=%s",
    (mode, wideViewport, expected) => {
      expect(isSidebarEffectivelyExpanded(mode, wideViewport)).toBe(expected);
    },
  );
});
