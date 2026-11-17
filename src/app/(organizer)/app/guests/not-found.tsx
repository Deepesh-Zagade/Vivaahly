import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";

export default function GuestNotFound() {
  return <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6"><section className="w-full rounded-3xl border border-outline-variant bg-white p-8 text-center shadow-sm sm:p-12"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-primary"><UiIcon name="unavailable" className="h-7 w-7" /></span><h1 className="mt-5 font-headline-lg text-3xl font-semibold text-on-surface">Guest record not found</h1><p className="mt-2 text-body-md text-on-surface-variant">This guest may have been removed or may not belong to this wedding.</p><Link href="/app/guests" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-label-md font-semibold text-on-primary"><UiIcon name="arrow-left" className="h-4 w-4" />Back to Wedding Guests</Link></section></main>;
}
