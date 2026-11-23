import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";

export default function CampaignNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full rounded-2xl border border-outline-variant/70 bg-white p-7 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary">
          <UiIcon name="mail-lock" className="h-5 w-5" />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
          Invitation delivery
        </p>
        <h1 className="mt-2 font-headline-lg text-3xl text-primary sm:text-4xl">
          Campaign not found
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-on-surface-variant">
          This delivery campaign does not exist, belongs to another wedding, or is no longer available.
        </p>
        <Link
          href="/app/invitations"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary"
        >
          <UiIcon name="arrow-left" className="h-4 w-4" />
          Back to Guest Invitations
        </Link>
      </section>
    </main>
  );
}
