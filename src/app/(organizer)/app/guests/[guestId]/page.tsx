import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RemoveGuestButton } from "@/app/(organizer)/app/guests/_components/remove-guest-button";
import {
  GuestSuccessNotice,
  type GuestNotice,
} from "@/app/(organizer)/app/guests/_components/guest-success-notice";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  formatEventDay,
  formatEventTimeRange,
} from "@/modules/events/event.presentation";
import { getEventService } from "@/modules/events/event.server";
import { getGuestService } from "@/modules/guests/guest.server";
import {
  addGuestDirectoryNotice,
  buildGuestEditHref,
  normalizeGuestDirectoryReturnTo,
} from "@/modules/guests/guest.navigation";
import { GUEST_TAG_LABELS } from "@/modules/guests/guest.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { ApplicationError } from "@/server/http/errors";

export const metadata: Metadata = { title: "Guest details" };
export const dynamic = "force-dynamic";

export default async function GuestDetailsPage({ params, searchParams }: { params: Promise<{ guestId: string }>; searchParams: Promise<{ notice?: string | string[]; returnTo?: string | string[] }> }) {
  const [{ guestId }, query, organizer] = await Promise.all([params, searchParams, requireCurrentOrganizer()]);
  if (!organizer.membership) redirect("/app/onboarding");
  const guestService = await getGuestService();
  let details;
  try {
    details = await guestService.getGuest(organizer.membership, guestId);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const [events, wedding] = await Promise.all([
    (await getEventService()).listEvents(organizer.membership),
    (await getWeddingService()).getWeddingForOrganizer(organizer.membership),
  ]);
  const invitedEvents = events.filter((event) => details.eventIds.includes(event.id));
  const notice = parseNotice(query.notice);
  const guest = details.guest;
  const returnTo = normalizeGuestDirectoryReturnTo(query.returnTo);
  const returningToInvitations = returnTo.startsWith("/app/invitations");
  const editHref = buildGuestEditHref(guest.id, returnTo);
  const invitedEventDays = new Map<string, number>();
  for (const event of events) {
    const day = formatEventDay(event.startAt, wedding.timezone);
    if (!invitedEventDays.has(day)) invitedEventDays.set(day, invitedEventDays.size + 1);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      {notice ? <GuestSuccessNotice notice={notice} /> : null}
      <Link href={returnTo} className="group inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-on-surface-variant transition-colors hover:text-primary"><UiIcon name="arrow-left" className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />{returningToInvitations ? "Back to Guest Invitations" : "Back to Wedding Guests"}</Link>

      <header className="mt-2 border-b border-outline-variant/60 pb-4">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="min-w-0">
              <h1 className="font-headline-lg text-[2.15rem] font-normal leading-[1.05] tracking-tight text-primary sm:text-[2.7rem]">{guest.displayName.en}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-on-surface-variant">{guest.displayName.mr ? <span lang="mr">{guest.displayName.mr}</span> : null}<span>{guest.displayName.mr ? "·" : null} Added {formatGuestCreatedAt(guest.createdAt)}</span></div>
              <div className="mt-2 flex flex-wrap gap-1.5">{guest.tags.length ? guest.tags.map((tag) => <span key={tag} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${tag === "VIP" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-primary/10 text-primary"}`}>{GUEST_TAG_LABELS[tag]}</span>) : <span className="text-body-sm italic text-outline">No tags added</span>}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2"><Link href={editHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary shadow-sm hover:bg-primary-container"><UiIcon name="edit" className="h-4 w-4" />Edit guest</Link><RemoveGuestButton guestId={guest.id} displayName={guest.displayName.en} returnHref={addGuestDirectoryNotice(returnTo, "guest-removed")} /></div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-5">
          <DetailCard title={guest.guestType === "FAMILY" ? "Family primary contact" : "Guest contact"} icon="user-check">
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Primary invitee" value={guest.primaryContact.name.en} secondary={guest.primaryContact.name.mr} />
              <DetailItem label="Email address" value={guest.primaryContact.email ?? "Not added"} muted={!guest.primaryContact.email} />
              <DetailItem label="Contact number" value={guest.primaryContact.phone ?? "Not added"} muted={!guest.primaryContact.phone} />
              <DetailItem label="Directory type" value={guest.guestType === "FAMILY" ? "Family guest" : "Individual guest"} />
            </div>
          </DetailCard>

          <DetailCard title="Organizer-only notes" icon="lock">
            {guest.organizerNotes ? <p className="whitespace-pre-wrap text-body-md leading-6 text-on-surface">{guest.organizerNotes}</p> : <EmptyBlock text="No private organizer notes have been added." />}
          </DetailCard>

          <section className="rounded-2xl border border-primary/15 bg-primary-fixed/30 p-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"><UiIcon name="mail-lock" className="h-4 w-4" /></span><div><h2 className="text-title-md font-semibold text-on-surface">Personalized invitation delivery</h2><p className="mt-1 text-body-sm leading-5 text-on-surface-variant">Send, resend, or revoke this guest&apos;s private invitation from the delivery workspace.</p></div></div>
              <Link href={`/app/invitations?${new URLSearchParams({ q: guest.displayName.en })}`} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-label-sm font-semibold text-on-primary"><UiIcon name="mail-out" className="h-4 w-4" />Manage invitation</Link>
            </div>
          </section>
        </div>

        <aside>
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-outline-variant/40 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-primary"><UiIcon name="calendar" className="h-4 w-4" /></span>
              <div className="min-w-0">
                <h2 className="text-title-md font-semibold text-on-surface">Invited ceremonies</h2>
                <p className="text-[11px] text-primary">{invitedEvents.length} of {events.length} ceremonies assigned</p>
              </div>
              <Link href={editHref} className="ml-auto min-h-9 px-1 py-2 text-label-sm font-semibold text-primary hover:underline">Manage</Link>
            </div>
            <div className="my-3 h-px bg-outline-variant/60" />
            {invitedEvents.length ? <div className="space-y-2.5">{invitedEvents.map((event) => { const day = formatEventDay(event.startAt, wedding.timezone); const venue = event.venue.name.en || event.venue.address.en; return <Link key={event.id} href={`/app/events/${event.id}`} className="group block rounded-xl bg-surface-container-low px-3.5 py-3 transition-colors hover:bg-primary/7"><span className="flex items-start justify-between gap-3"><strong className="text-body-md font-semibold text-on-surface group-hover:text-primary">{event.title.en}</strong><span className="shrink-0 rounded bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">Day {invitedEventDays.get(day)}</span></span><span className="mt-1 flex items-center gap-1.5 text-[11px] leading-4 text-on-surface-variant"><UiIcon name="clock" className="h-3 w-3 shrink-0 text-primary" />{day} · {formatEventTimeRange(event.startAt, event.endAt, wedding.timezone, false)}</span>{venue ? <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] leading-4 text-outline"><UiIcon name="map-pin" className="h-3 w-3 shrink-0 text-primary" />{venue}</span> : null}</Link>; })}</div> : <EmptyBlock text="No ceremonies are assigned to this guest yet." />}
          </section>
        </aside>
      </div>
    </main>
  );
}

function DetailCard({ title, icon, action, children }: { title: string; icon: "user-check" | "calendar" | "lock"; action?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-outline-variant/40 sm:p-5"><div className="mb-4 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-fixed text-primary"><UiIcon name={icon} className="h-4 w-4" /></span><h2 className="font-headline-lg text-xl font-semibold text-on-surface">{title}</h2>{action ? <span className="ml-auto">{action}</span> : null}</div>{children}</section>; }
function DetailItem({ label, value, secondary, muted = false }: { label: string; value: string; secondary?: string; muted?: boolean }) { return <div className="rounded-xl bg-surface-container-low p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-outline">{label}</p><p className={`mt-1 break-words text-body-md font-semibold ${muted ? "italic text-outline" : "text-on-surface"}`}>{value}</p>{secondary ? <p lang="mr" className="mt-0.5 text-body-sm text-on-surface-variant">{secondary}</p> : null}</div>; }
function EmptyBlock({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-center text-body-sm text-on-surface-variant">{text}</p>; }
function formatGuestCreatedAt(value: Date) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(value); }
function parseNotice(value: string | string[] | undefined): GuestNotice | undefined { const notice = Array.isArray(value) ? value[0] : value; return notice === "guest-created" || notice === "guest-updated" ? notice : undefined; }
