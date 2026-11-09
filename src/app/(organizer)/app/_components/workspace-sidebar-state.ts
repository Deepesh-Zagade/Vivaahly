export type SidebarMode = "default" | "expanded" | "collapsed";

export function isSidebarEffectivelyExpanded(
  mode: SidebarMode,
  wideViewport: boolean,
) {
  return mode === "expanded" || (mode === "default" && wideViewport);
}
