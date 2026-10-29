"use client";

import { useEffect, useState } from "react";

const SUCCESS_NOTICE_DURATION_MS = 5_000;

export function WorkspaceSuccessNotice() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    const cleanUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", cleanUrl);

    const timeout = window.setTimeout(
      () => setVisible(false),
      SUCCESS_NOTICE_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-7 flex max-w-4xl items-start gap-3 rounded-2xl border border-secondary/25 bg-secondary-fixed p-4 text-on-secondary-fixed shadow-sm"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <div>
        <p className="text-title-md font-semibold">
          Wedding details updated successfully
        </p>
        <p className="mt-1 text-body-sm text-on-secondary-fixed-variant">
          Your latest details now appear throughout the wedding workspace.
        </p>
      </div>
    </div>
  );
}
