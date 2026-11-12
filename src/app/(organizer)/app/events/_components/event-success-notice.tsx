"use client";

import { useEffect, useState } from "react";
import { UiIcon } from "@/components/ui-icon";

const messages = {
  "event-created": "Event created successfully.",
  "event-updated": "Event updated successfully.",
  "event-removed": "Event removed successfully.",
} as const;

export function EventSuccessNotice({
  notice,
}: {
  notice: keyof typeof messages;
}) {
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
        <p className="text-title-md font-semibold">{messages[notice]}</p>
        <p className="mt-0.5 text-body-sm text-on-secondary-fixed-variant">
          Your wedding schedule now reflects the latest event information.
        </p>
      </div>
    </div>
  );
}
