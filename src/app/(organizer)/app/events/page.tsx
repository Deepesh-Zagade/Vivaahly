import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventSuccessNotice } from "@/app/(organizer)/app/events/_components/event-success-notice";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  eventCalendarDate,
  formatEventDay,
  formatEventTimeRange,
} from "@/modules/events/event.presentation";
import { getEventService } from "@/modules/events/event.server";
import type { WeddingEvent } from "@/modules/events/event.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";

export const metadata: Metadata = { title: "Wedding events" };
export const dynamic = "force-dynamic";

type EventsPageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const [query, organizer] = await Promise.all([
    searchParams,
    requireCurrentOrganizer(),
  ]);
  if (!organizer.membership) redirect("/app/onboarding");

  const [events, wedding] = await Promise.all([
    (await getEventService()).listEvents(organizer.membership),
    (await getWeddingService()).getWeddingForOrganizer(organizer.membership),
  ]);
  const grouped = groupEvents(events, wedding.timezone);
  const nextEventId = events.find((event) => event.endAt >= new Date())?.id;
  const atLimit = events.length >= 10;
  const notice =
    query.notice === "event-removed" ? "event-removed" : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-9 lg:px-8">
      {notice ? <EventSuccessNotice notice={notice} /> : null}

      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="font-headline-lg text-[2.4rem] font-normal leading-tight tracking-tight text-primary sm:text-[3.25rem]">
              Wedding Events
            </h1>
            <span className="text-body-sm text-outline">· {events.length} of 10 events</span>
          </div>
          <p className="mt-2 max-w-2xl text-body-lg leading-7 text-on-surface-variant">
            Keep your family&apos;s ceremonies organized in one clear,
            chronological schedule.
          </p>
        </div>
        {!atLimit ? (
          <Link
            href="/app/events/new"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-title-md font-semibold text-on-primary shadow-md shadow-primary/15 transition-colors hover:bg-primary-container"
          >
            <UiIcon name="plus" className="h-4 w-4" />
            Create event
          </Link>
        ) : null}
      </section>

      {atLimit ? (
        <section className="mt-7 flex items-start gap-3 rounded-2xl border border-tertiary/25 bg-tertiary-fixed p-4 text-on-tertiary-fixed" role="status">
          <UiIcon name="info" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="text-title-md font-semibold">
              This wedding has reached the maximum of 10 active events.
            </h2>
            <p className="mt-1 text-body-sm text-on-tertiary-fixed-variant">
              Existing events remain available to view, edit, or remove.
              Removing one will make another event slot available.
            </p>
          </div>
        </section>
      ) : null}

      {events.length === 0 ? (
        <EmptyEvents />
      ) : (
        <div className="mt-8 space-y-9">
          {grouped.map((group, dayIndex) => {
            const dayPalette = eventPalette(dayIndex * 2);
            return (
            <section key={group.date} aria-labelledby={`event-day-${dayIndex}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="font-headline-lg text-2xl font-semibold" style={{ color: dayPalette.accent }}>
                    Day {dayIndex + 1}
                  </span>
                  <h2 id={`event-day-${dayIndex}`} className="text-body-md font-normal text-on-surface-variant">
                    · {formatEventDay(group.events[0].startAt, wedding.timezone)}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-outline">
                  {group.events.length} {group.events.length === 1 ? "ceremony" : "ceremonies"}
                </span>
              </div>
              <div className="space-y-4">
                {group.events.map((event, eventIndex) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    timezone={wedding.timezone}
                    next={event.id === nextEventId}
                    palette={eventPalette(dayIndex * 2 + eventIndex)}
                  />
                ))}
              </div>
            </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function groupEvents(events: WeddingEvent[], timezone: string) {
  const groups = new Map<string, WeddingEvent[]>();
  for (const event of events) {
    const key = eventCalendarDate(event.startAt, timezone);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()].map(([date, groupedEvents]) => ({
    date,
    events: groupedEvents,
  }));
}

type EventPalette = { accent: string; soft: string };

const EVENT_PALETTES: EventPalette[] = [
  { accent: "#a64f3b", soft: "#f8ece7" },
  { accent: "#702b45", soft: "#fde2e9" },
  { accent: "#806015", soft: "#f7f0df" },
  { accent: "#99536c", soft: "#f7e9ee" },
  { accent: "#4e6b5c", soft: "#e8f0ec" },
];

function eventPalette(index: number) {
  return EVENT_PALETTES[index % EVENT_PALETTES.length];
}

function EventCard({ event, timezone, next, palette }: { event: WeddingEvent; timezone: string; next: boolean; palette: EventPalette }) {
  const location = event.venue.name.en || event.venue.address.en;
  const dateParts = new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  }).formatToParts(event.startAt);
  const month = dateParts.find((part) => part.type === "month")?.value;
  const day = dateParts.find((part) => part.type === "day")?.value;
  return (
    <article className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-outline-variant/45 transition-shadow hover:shadow-md sm:p-6">
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: palette.accent }} />
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-start gap-4 pl-1">
          <div className="hidden h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl sm:flex" style={{ backgroundColor: palette.soft, color: palette.accent }}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.13em]">{month}</span>
            <strong className="font-headline-lg text-2xl leading-none">{day}</strong>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-lg text-2xl font-semibold tracking-tight text-on-surface">
                {event.title.en}
              </h3>
              {event.title.mr ? <span lang="mr" className="text-body-md text-on-surface-variant">/ {event.title.mr}</span> : null}
              {next ? <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: palette.soft, color: palette.accent }}>Next ceremony</span> : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5"><UiIcon name="clock" className="h-4 w-4" style={{ color: palette.accent }} />{formatEventTimeRange(event.startAt, event.endAt, timezone)}</span>
              {location ? <span className="flex items-center gap-1.5"><UiIcon name="map-pin" className="h-4 w-4" style={{ color: palette.accent }} />{location}</span> : null}
            </div>
            {event.dressCode.en ? <div className="flex flex-wrap items-center gap-2 pt-1"><span className="text-[11px] font-semibold text-outline">Dress code:</span><span className="rounded-full bg-surface-container px-2.5 py-1 text-[12px] text-on-surface-variant">{event.dressCode.en}</span></div> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 pl-1 lg:pl-0">
          <Link href={`/app/events/${event.id}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container">
            View details
          </Link>
          <Link href={`/app/events/${event.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-container px-5 py-2.5 text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container-high">
            <UiIcon name="edit" className="h-4 w-4 text-primary" /> Edit
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyEvents() {
  return (
    <section className="mt-9 rounded-3xl border border-dashed border-outline-variant bg-white px-5 py-14 text-center shadow-sm sm:px-10 sm:py-20">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <UiIcon name="sparkles" className="h-7 w-7" />
      </span>
      <h2 className="mt-5 font-headline-lg text-3xl font-semibold text-on-surface">
        Create your first wedding event
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-body-md leading-7 text-on-surface-variant">
        Add ceremonies such as Haldi, Mehendi, Sangeet, the wedding, and
        reception to build your family&apos;s shared celebration schedule.
      </p>
      <Link href="/app/events/new" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-title-md font-semibold text-on-primary shadow-md transition-colors hover:bg-primary-container">
        <UiIcon name="plus" className="h-4 w-4" /> Create event
      </Link>
    </section>
  );
}
