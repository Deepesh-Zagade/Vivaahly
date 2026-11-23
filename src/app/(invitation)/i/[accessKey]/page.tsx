import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { UiIcon } from "@/components/ui-icon";
import { formatEventDay, formatEventTimeRange } from "@/modules/events/event.presentation";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import type { InvitationAccessContext } from "@/modules/guest-invitations/guest-invitation.types";
import { ApplicationError } from "@/server/http/errors";

export const metadata: Metadata = {
  title: "Wedding invitation",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function GuestInvitationPage({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  let invitation: InvitationAccessContext;
  try {
    invitation = await (await getGuestInvitationService()).resolveAccess(
      (await params).accessKey,
    );
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-outline-variant/60 bg-white shadow-2xl shadow-primary/10">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/60 px-5 py-4 sm:px-8">
          <Brand />
          <span className="rounded-full bg-surface-container-high px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">Wedding invitation</span>
        </header>

        <section className="bg-primary px-5 py-12 text-center text-on-primary sm:px-10 sm:py-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-fixed">Together with their families</p>
          <h1 className="mt-4 font-headline-lg text-5xl font-normal leading-tight sm:text-7xl">{invitation.coupleName}</h1>
          {invitation.weddingTitle && invitation.weddingTitle !== invitation.coupleName ? <p className="mt-4 font-headline-lg text-2xl italic text-primary-fixed">“{invitation.weddingTitle}”</p> : null}
        </section>

        <section className="px-5 py-8 sm:px-10 sm:py-11">
          <p className="font-headline-lg text-3xl text-primary">Namaste {invitation.primaryContactName || invitation.guestName},</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">With the blessings of our elders and immense joy in our hearts, we invite {invitation.guestType === "FAMILY" ? "you and your family" : "you"} to celebrate this new beginning with us.</p>

          <div className="mt-9 flex items-end justify-between gap-3 border-b border-outline-variant/70 pb-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">Your celebrations</p><h2 className="mt-1 font-headline-lg text-2xl font-semibold text-primary">Invited ceremonies</h2></div>
            <span className="text-xs text-on-surface-variant">{invitation.events.length} {invitation.events.length === 1 ? "ceremony" : "ceremonies"}</span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {invitation.events.length ? invitation.events.map((event) => <article key={event.id} className="rounded-2xl bg-surface-container-low p-4 sm:p-5"><h3 className="font-headline-lg text-2xl font-semibold text-primary">{event.title.en}</h3><p className="mt-2 flex gap-2 text-xs leading-5 text-on-surface-variant"><UiIcon name="calendar" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" /> <span>{formatEventDay(event.startAt, invitation.weddingTimezone)}<br />{formatEventTimeRange(event.startAt, event.endAt, invitation.weddingTimezone, false)}</span></p>{event.venueName || event.venueAddress ? <p className="mt-2 flex gap-2 text-xs leading-5 text-on-surface-variant"><UiIcon name="map-pin" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" /><span>{[event.venueName, event.venueAddress].filter(Boolean).join(" · ")}</span></p> : null}{event.dressCode ? <p className="mt-3 w-fit rounded-full bg-white px-3 py-1 text-[11px] text-on-surface-variant">Dress code: {event.dressCode}</p> : null}</article>) : <p className="col-span-full rounded-2xl bg-surface-container-low p-6 text-sm text-on-surface-variant">Ceremony details will be shared with you soon.</p>}
          </div>

          <div className="mt-8 rounded-2xl border border-primary/10 bg-primary-fixed/25 px-5 py-4 text-center text-sm leading-6 text-on-primary-fixed-variant">This private invitation is intended for <strong>{invitation.guestName}</strong>{invitation.guestType === "FAMILY" ? " and family" : ""}. Please keep this link private.</div>
        </section>
        <footer className="bg-surface-container px-5 py-5 text-center text-xs leading-5 text-on-surface-variant">Less coordination. More celebration.<br /><span className="text-outline">Vivaahly · {invitation.weddingCity}</span></footer>
      </div>
    </main>
  );
}
