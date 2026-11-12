"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UiIcon } from "@/components/ui-icon";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/shared/http/fetch-with-timeout";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function removeEvent() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`/api/v1/events/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        setError(body.error?.message ?? "We couldn't remove this event.");
        return;
      }
      router.replace("/app/events?notice=event-removed");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof RequestTimeoutError
          ? "Vivaahly took too long to respond. Please try again."
          : "We couldn't reach Vivaahly. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-container px-5 py-2.5 text-label-md font-semibold text-secondary transition-colors hover:bg-error-container hover:text-error"
      >
        <UiIcon name="trash" className="h-4 w-4" />
        Remove event
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-on-surface/40 backdrop:backdrop-blur-sm"
      >
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
              <UiIcon name="warning" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[1.25rem] font-semibold">
                Remove this event?
              </h2>
              <p className="mt-1 text-body-md leading-6 text-on-surface-variant">
                This event will disappear from active wedding planning and the
                guest experience. Historical references will be preserved.
              </p>
            </div>
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="min-h-10 rounded-xl bg-surface-container px-4 py-2.5 text-title-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60"
            >
              Keep event
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={removeEvent}
              className="min-h-10 rounded-xl bg-error px-5 py-2.5 text-title-md font-semibold text-on-error shadow-sm transition-colors hover:bg-on-error-container disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Removing…" : "Remove event"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
