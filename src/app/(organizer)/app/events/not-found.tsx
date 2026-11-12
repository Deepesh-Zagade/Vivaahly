import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";

export default function EventNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6">
      <section className="w-full rounded-3xl border border-outline-variant bg-white p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high text-primary"><UiIcon name="unavailable" className="h-6 w-6" /></span>
        <h1 className="mt-5 font-headline-lg text-3xl font-semibold text-on-surface">This event is no longer available</h1>
        <p className="mx-auto mt-2 max-w-lg text-body-md leading-7 text-on-surface-variant">It may have been removed by another organizer, or the link may be incorrect.</p>
        <Link href="/app/events" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-label-md font-semibold text-on-primary"><UiIcon name="arrow-left" className="h-4 w-4" />Back to Wedding Events</Link>
      </section>
    </main>
  );
}
