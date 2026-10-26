"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });

      if (!response.ok) {
        setError("Could not sign out. Please try again.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
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
        className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-label-md font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
      >
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
