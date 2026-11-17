"use client";

import { useEffect, useState } from "react";
import { UiIcon } from "@/components/ui-icon";

const messages = {
  "guest-created": {
    title: "Guest added successfully.",
    detail: "The guest directory and ceremony access now reflect this record.",
  },
  "guest-updated": {
    title: "Guest details updated successfully.",
    detail: "The latest profile, tags, and ceremony access are now saved.",
  },
  "guest-removed": {
    title: "Guest removed successfully.",
    detail: "The guest is no longer active in this wedding directory.",
  },
} as const;

export type GuestNotice = keyof typeof messages;

export function GuestSuccessNotice({ notice }: { notice: GuestNotice }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("notice");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    const timeout = window.setTimeout(() => setVisible(false), 5_000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;
  const message = messages[notice];
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-secondary/25 bg-secondary-fixed p-4 text-on-secondary-fixed shadow-sm"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
        <UiIcon name="check-circle" className="h-4 w-4" />
      </span>
      <div>
        <p className="text-title-md font-semibold">{message.title}</p>
        <p className="mt-0.5 text-body-sm text-on-secondary-fixed-variant">
          {message.detail}
        </p>
      </div>
    </div>
  );
}
