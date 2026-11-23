import Link from "next/link";
import { Brand } from "@/components/brand";
import { UiIcon } from "@/components/ui-icon";

export default function InvitationNotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10"><section className="w-full max-w-xl rounded-3xl border border-outline-variant/60 bg-white p-7 text-center shadow-xl sm:p-10"><Brand className="justify-center" /><span className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-primary"><UiIcon name="mail-lock" className="h-6 w-6" /></span><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Private invitation</p><h1 className="mt-2 font-headline-lg text-3xl font-semibold text-primary">This invitation is unavailable</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">The invitation may have been revoked, or the link may be incomplete. Please ask the wedding family to send you a current invitation.</p><Link href="/" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary">Back to Vivaahly</Link></section></main>;
}
