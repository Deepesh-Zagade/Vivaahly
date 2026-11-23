import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { formatEventDay, formatEventTimeRange } from "@/modules/events/event.presentation";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { coupleDisplayName } from "@/modules/wedding/wedding.presentation";
import { getWeddingService } from "@/modules/wedding/wedding.server";

export const metadata: Metadata = { title: "Invitation email preview" };
export const dynamic = "force-dynamic";

export default async function InvitationPreviewPage() {
  const organizer = await requireCurrentOrganizer();
  if (!organizer.membership) redirect("/app/onboarding");
  const [hub, wedding] = await Promise.all([
    (await getGuestInvitationService()).listHub(organizer.membership, { page: 1, pageSize: 10 }),
    (await getWeddingService()).getWeddingForOrganizer(organizer.membership),
  ]);
  const recipient = hub.invitations.find((item) => item.primaryContact.email) ?? hub.invitations[0];
  const coupleName = coupleDisplayName(
    wedding.couple.groom.name.en,
    wedding.couple.bride.name.en,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link href="/app/invitations" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><UiIcon name="arrow-left" className="h-4 w-4" /> Back to guest invitations</Link>
          <h1 className="mt-5 font-headline-lg text-[2.35rem] leading-tight text-primary sm:text-[2.8rem]">Invitation email preview</h1>
          <p className="mt-1 text-sm text-on-surface-variant">This is the email guests receive. Each email includes only that guest&apos;s assigned ceremonies.</p>
        </div>
        <span className="w-fit rounded-full bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface-variant">Preview only</span>
      </div>

      {!recipient ? <section className="mt-7 rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-16 text-center"><UiIcon name="mail" className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 font-headline-lg text-2xl font-semibold text-primary">Add a guest to preview the email</h2><p className="mt-2 text-sm text-on-surface-variant">The preview uses a real guest name and their assigned ceremonies.</p><Link href="/app/guests/new" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary">Add guest</Link></section> : (
        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <section className="overflow-hidden rounded-2xl border border-outline-variant/70 bg-white shadow-xl shadow-primary/5" aria-label="Invitation email">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/60 px-5 py-4 sm:px-7"><Brand href={null} /><span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Wedding invitation</span></div>
            <div className="bg-primary px-6 py-10 text-center text-on-primary sm:px-10"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-fixed">Together with their families</p><h2 className="mt-3 font-headline-lg text-4xl font-normal sm:text-5xl">{coupleName}</h2>{wedding.title.en && wedding.title.en !== coupleName ? <p className="mt-3 font-headline-lg text-xl italic text-primary-fixed">“{wedding.title.en}”</p> : null}</div>
            <div className="px-6 py-7 sm:px-10 sm:py-9"><p className="font-headline-lg text-2xl text-primary">Namaste {recipient.primaryContact.name.en || recipient.displayName.en},</p><p className="mt-3 text-sm leading-7 text-on-surface-variant">With the blessings of our elders and immense joy in our hearts, we invite {recipient.guestType === "FAMILY" ? "you and your family" : "you"} to celebrate this new beginning with us.</p><p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">Your invited ceremonies</p><div className="mt-2 divide-y divide-outline-variant/60">{recipient.assignedEvents.length ? recipient.assignedEvents.map((event) => <article key={event.id} className="py-4"><h3 className="font-headline-lg text-xl font-semibold text-primary">{event.title.en}</h3><p className="mt-1 text-xs leading-5 text-on-surface-variant">{formatEventDay(event.startAt, wedding.timezone)} · {formatEventTimeRange(event.startAt, event.endAt, wedding.timezone, false)}</p>{event.venueName ? <p className="mt-0.5 text-xs text-on-surface-variant">{event.venueName}</p> : null}</article>) : <p className="py-5 text-sm text-on-surface-variant">Ceremony details will be shared soon.</p>}</div><span className="mx-auto mt-7 flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary">View wedding invitation <UiIcon name="arrow-right" className="h-4 w-4" /></span><p className="mt-6 text-center text-xs leading-5 text-outline">This personalized invitation is intended for {recipient.displayName.en}. Please do not forward it.</p></div>
            <div className="bg-surface-container px-6 py-4 text-center text-xs leading-5 text-on-surface-variant">Less coordination. More celebration.<br />Vivaahly · {wedding.primaryVenue.city.en}</div>
          </section>
          <aside className="rounded-2xl border border-outline-variant/60 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-on-surface">Preview recipient</h2><p className="mt-3 text-sm font-semibold text-primary">{recipient.displayName.en}</p><p className="mt-1 break-all text-xs text-on-surface-variant">{recipient.primaryContact.email ?? "No email on file"}</p><div className="mt-5 border-t border-outline-variant/60 pt-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-outline">Subject</p><p className="mt-1 text-sm leading-5 text-on-surface">The wedding celebration of {coupleName}</p></div><div className="mt-4 rounded-xl bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">Personal invitation access is added only during real delivery. It is never exposed in this organizer preview.</div></aside>
        </div>
      )}
    </main>
  );
}
