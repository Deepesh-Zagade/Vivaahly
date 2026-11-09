export const WORKSPACE_DATA_CHANGED_EVENT = "vivaahly:workspace-data-changed";

type WorkspaceRouter = {
  refresh: () => void;
  replace: (href: string) => void;
};

type ListenerTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

type WorkspaceReconciliationOptions = {
  windowTarget: ListenerTarget;
  documentTarget: ListenerTarget;
  getVisibilityState: () => string;
  refresh: () => void;
  cooldownMs?: number;
  now?: () => number;
};

export function replaceAndRefreshWorkspace(
  router: WorkspaceRouter,
  href: string,
) {
  router.replace(href);
  router.refresh();
}

export function subscribeToWorkspaceReconciliation({
  windowTarget,
  documentTarget,
  getVisibilityState,
  refresh,
  cooldownMs = 500,
  now = Date.now,
}: WorkspaceReconciliationOptions) {
  let lastRefreshAt = Number.NEGATIVE_INFINITY;

  function reconcile() {
    const currentTime = now();
    if (currentTime - lastRefreshAt < cooldownMs) return;
    lastRefreshAt = currentTime;
    refresh();
  }

  function reconcileWhenVisible() {
    if (getVisibilityState() === "visible") reconcile();
  }

  windowTarget.addEventListener("focus", reconcile);
  windowTarget.addEventListener("pageshow", reconcile);
  windowTarget.addEventListener(WORKSPACE_DATA_CHANGED_EVENT, reconcile);
  documentTarget.addEventListener("visibilitychange", reconcileWhenVisible);

  return () => {
    windowTarget.removeEventListener("focus", reconcile);
    windowTarget.removeEventListener("pageshow", reconcile);
    windowTarget.removeEventListener(WORKSPACE_DATA_CHANGED_EVENT, reconcile);
    documentTarget.removeEventListener("visibilitychange", reconcileWhenVisible);
  };
}
