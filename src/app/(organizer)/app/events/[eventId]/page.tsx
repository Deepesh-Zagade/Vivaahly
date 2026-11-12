import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteEventButton } from "@/app/(organizer)/app/events/_components/delete-event-button";
import { EventSuccessNotice } from "@/app/(organizer)/app/events/_components/event-success-notice";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  formatEventDay,
  formatEventTimeRange,
} from "@/modules/events/event.presentation";
import { getEventService } from "@/modules/events/event.server";
import type { WeddingEvent } from "@/modules/events/event.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { ApplicationError } from "@/server/http/errors";

export const metadata: Metadata = { title: "Event details" };
export const dynamic = "force-dynamic";

type EventDetailsPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function EventDetailsPage({
  params,
  searchParams,
}: EventDetailsPageProps) {
  const [{ eventId }, query, organizer] = await Promise.all([
    params,
    searchParams,
    requireCurrentOrganizer(),
  ]);
  if (!organizer.membership) redirect("/app/onboarding");

  let event: WeddingEvent;
  try {
    event = await (await getEventService()).getEvent(
      organizer.membership,
      eventId,
    );
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
  const wedding = await (
    await getWeddingService()
  ).getWeddingForOrganizer(organizer.membership);
  const notice =
    query.notice === "event-created" || query.notice === "event-updated"
      ? query.notice
      : undefined;
  const hasDescription = event.description.en || event.description.mr;
  const hasVenue =
    event.venue.name.en ||
    event.venue.name.mr ||
    event.venue.address.en ||
    event.venue.address.mr ||
    event.venue.mapUrl;
  const hasDressCode = event.dressCode.en || event.dressCode.mr;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      {notice ? <EventSuccessNotice notice={notice} /> : null}
      <Link href="/app/events" className="group inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-on-surface-variant transition-colors hover:text-primary">
        <UiIcon name="arrow-left" className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />
        Back to Wedding Events
      </Link>

      <header className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-outline-variant/40 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-outline">Wedding event</p>
            <h1 className="font-headline-lg text-[2.5rem] font-normal leading-[1.05] tracking-tight text-primary sm:text-[3.5rem]">{event.title.en}</h1>
            {event.title.mr ? <p lang="mr" className="font-headline-lg text-2xl font-normal text-secondary">{event.title.mr}</p> : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-body-md text-on-surface-variant">
              <span className="flex items-center gap-1.5"><UiIcon name="calendar" className="h-5 w-5 text-primary" />{formatEventDay(event.startAt, wedding.timezone)}</span>
              <span className="hidden text-outline sm:inline">·</span>
              <span className="flex items-center gap-1.5"><UiIcon name="clock" className="h-5 w-5 text-primary" />{formatEventTimeRange(event.startAt, event.endAt, wedding.timezone)} ({formatDuration(event.startAt, event.endAt)})</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/events/${event.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"><UiIcon name="edit" className="h-4 w-4" />Edit event</Link>
            <DeleteEventButton eventId={event.id} />
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {hasDescription ? (
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-outline-variant/40 sm:p-6">
              <h2 className="text-headline-sm font-semibold text-on-surface">Ceremony Description</h2>
              <div className="mt-5 space-y-5">
                {event.description.en ? <div><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-outline">English</span><p className="mt-1 text-body-lg leading-8 text-on-surface">{event.description.en}</p></div> : null}
                {event.description.mr ? <div><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-outline">मराठी (Marathi)</span><p lang="mr" className="mt-1 text-body-md leading-7 text-on-surface-variant">{event.description.mr}</p></div> : null}
              </div>
            </article>
          ) : null}

          {hasVenue ? (
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-outline-variant/40 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-headline-sm font-semibold text-on-surface">Venue &amp; Location</h2>
                {event.venue.mapUrl ? <a href={event.venue.mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-label-md font-semibold text-primary hover:text-primary-container">Open in Google Maps <span aria-hidden="true">↗</span></a> : null}
              </div>
              <div className="mt-5 space-y-1">
                {event.venue.name.en ? <h3 className="font-headline-lg text-2xl font-semibold text-on-surface">{event.venue.name.en}</h3> : null}
                {event.venue.name.mr ? <p lang="mr" className="text-body-md text-on-surface-variant">{event.venue.name.mr}</p> : null}
                {event.venue.address.en ? <p className="pt-2 text-body-md text-on-surface">{event.venue.address.en}</p> : null}
                {event.venue.address.mr ? <p lang="mr" className="text-body-sm text-on-surface-variant">{event.venue.address.mr}</p> : null}
              </div>
              <div className="relative mt-5 flex h-48 items-center justify-center overflow-hidden rounded-xl bg-surface-container" style={{ backgroundImage: "radial-gradient(circle at 20% 25%, rgba(112,43,69,.18) 0 2px, transparent 3px), linear-gradient(135deg, rgba(255,240,242,.9), rgba(233,217,221,.85))", backgroundSize: "32px 32px, auto" }}>
                <span className="absolute left-[12%] top-1/2 h-px w-3/4 -rotate-6 bg-primary/20" />
                <span className="absolute left-1/3 top-[15%] h-3/4 w-px rotate-12 bg-secondary/20" />
                <div className="relative z-10 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-on-surface shadow-md backdrop-blur-sm"><UiIcon name="map-pin" className="h-5 w-5 text-primary" /><span className="text-body-sm font-semibold">{event.venue.name.en || event.venue.address.en || "Wedding venue"}</span></div>
              </div>
            </article>
          ) : null}
        </div>

        <aside className="space-y-6">
          {hasDressCode ? (
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-outline-variant/40 sm:p-6">
              <div className="flex items-center gap-2 text-secondary"><UiIcon name="sparkles" className="h-5 w-5" /><h2 className="text-title-md font-semibold text-on-surface">Attire &amp; Dress Code</h2></div>
              {event.dressCode.en ? <p className="mt-4 text-body-lg font-semibold leading-7 text-primary">{event.dressCode.en}</p> : null}
              {event.dressCode.mr ? <p lang="mr" className="mt-2 text-body-sm leading-6 text-on-surface-variant">{event.dressCode.mr}</p> : null}
            </article>
          ) : null}

          {event.privateNotes ? (
            <article className="rounded-2xl bg-surface-container p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-primary"><UiIcon name="lock" className="h-5 w-5" /><h2 className="text-title-md font-semibold">Private organizer notes</h2></div>
              <span className="mt-3 inline-block rounded-full bg-primary-fixed px-2.5 py-1 text-[11px] font-semibold text-on-primary-fixed">Visible only to wedding organizers</span>
              <div className="mt-4 rounded-xl bg-white p-4 shadow-sm"><p className="whitespace-pre-wrap text-body-sm leading-6 text-on-surface">{event.privateNotes}</p></div>
            </article>
          ) : null}

          {!hasDescription && !hasVenue && !hasDressCode && !event.privateNotes ? <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-body-md text-on-surface-variant lg:col-span-3">Add a description, venue, dress code, or organizer notes whenever your family is ready.</div> : null}
        </aside>
      </div>
    </main>
  );
}

function formatDuration(startAt: Date, endAt: Date) {
  const totalMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} minutes`;
  if (!minutes) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours}h ${minutes}m`;
}
