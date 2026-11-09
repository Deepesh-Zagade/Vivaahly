import { describe, expect, it, vi } from "vitest";
import {
  replaceAndRefreshWorkspace,
  subscribeToWorkspaceReconciliation,
  WORKSPACE_DATA_CHANGED_EVENT,
} from "@/app/(organizer)/app/_components/workspace-reconciliation";

describe("workspace reconciliation", () => {
  it("refreshes the persistent workspace layout after a local mutation navigation", () => {
    const calls: string[] = [];
    const router = {
      replace: (href: string) => calls.push(`replace:${href}`),
      refresh: () => calls.push("refresh"),
    };

    replaceAndRefreshWorkspace(
      router,
      "/app?notice=wedding-details-updated",
    );

    expect(calls).toEqual([
      "replace:/app?notice=wedding-details-updated",
      "refresh",
    ]);
  });

  it("reconciles changes made in another tab when this workspace becomes active", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new EventTarget();
    const refresh = vi.fn();
    let visibilityState = "hidden";
    let currentTime = 1_000;

    const unsubscribe = subscribeToWorkspaceReconciliation({
      windowTarget,
      documentTarget,
      getVisibilityState: () => visibilityState,
      refresh,
      now: () => currentTime,
    });

    windowTarget.dispatchEvent(new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(1);

    currentTime = 1_100;
    visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledTimes(1);

    currentTime = 1_600;
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledTimes(2);

    currentTime = 2_200;
    windowTarget.dispatchEvent(new Event(WORKSPACE_DATA_CHANGED_EVENT));
    expect(refresh).toHaveBeenCalledTimes(3);

    unsubscribe();
    currentTime = 3_000;
    windowTarget.dispatchEvent(new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(3);
  });
});
