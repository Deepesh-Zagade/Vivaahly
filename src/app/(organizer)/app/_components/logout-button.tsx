"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UiIcon } from "@/components/ui-icon";
import {
  fetchWithTimeout,
  RequestTimeoutError,
} from "@/shared/http/fetch-with-timeout";

type LogoutErrorResponse = {
  error?: { message?: string };
};

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setError(null);

    try {
      const response = await fetchWithTimeout("/api/v1/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json()) as LogoutErrorResponse;
        setError(result.error?.message ?? "Could not sign out. Please try again.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof RequestTimeoutError
          ? "Sign out took too long. Please try again shortly."
          : "Could not sign out. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={logout}
        disabled={pending}
        aria-label="Sign out"
        className={`${compact ? "min-h-9 px-2 text-xs" : "min-h-11 px-2.5 text-label-md sm:px-3"} inline-flex items-center gap-1 whitespace-nowrap rounded-xl py-2 font-semibold text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary disabled:cursor-wait disabled:opacity-70`}
      >
        {compact ? <UiIcon name="log-out" className="h-3.5 w-3.5" /> : null}
        {pending ? "Signing out..." : "Sign out"}
      </button>
      {error ? (
        <p role="alert" className="text-[12px] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
