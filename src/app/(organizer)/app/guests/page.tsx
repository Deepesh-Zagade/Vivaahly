import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GuestDirectoryFilters } from "@/app/(organizer)/app/guests/_components/guest-directory-filters";
import { GuestPagination } from "@/app/(organizer)/app/guests/_components/guest-pagination";
import {
  GuestSuccessNotice,
  type GuestNotice,
} from "@/app/(organizer)/app/guests/_components/guest-success-notice";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { formatEventDay } from "@/modules/events/event.presentation";
import { getEventService } from "@/modules/events/event.server";
import { getGuestService } from "@/modules/guests/guest.server";
import {
  buildGuestDetailsHref,
  buildGuestDirectoryHref,
} from "@/modules/guests/guest.navigation";
import { guestListQuerySchema } from "@/modules/guests/guest.schemas";
import {
  GUEST_TAG_LABELS,
  type GuestListQuery,
  type WeddingGuest,
} from "@/modules/guests/guest.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";

export const metadata: Metadata = { title: "Wedding guests" };
export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const [rawQuery, organizer] = await Promise.all([
    searchParams,
    requireCurrentOrganizer(),
  ]);
  if (!organizer.membership) redirect("/app/onboarding");

  const query = parseQuery(rawQuery);
  const guestService = await getGuestService();
  const eventService = await getEventService();
  const [result, events, wedding] = await Promise.all([
    guestService.listGuests(organizer.membership, query),
    eventService.listEvents(organizer.membership),
    (await getWeddingService()).getWeddingForOrganizer(organizer.membership),
  ]);
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const notice = parseNotice(rawQuery.notice);
  const canonicalPage = result.pageCount > 0 ? result.page : 1;
  if (canonicalPage !== query.page) {
    redirect(
      buildGuestDirectoryHref(
        { ...query, page: canonicalPage, pageSize: result.pageSize },
        notice,
      ),
    );
  }
  const effectiveQuery = {
    ...query,
    page: canonicalPage,
    pageSize: result.pageSize,
  };
  const returnTo = buildGuestDirectoryHref(effectiveQuery);
  const addGuestHref = `/app/guests/new?${new URLSearchParams({ returnTo })}`;
  const filtering = Boolean(query.q || query.guestType || query.tag || query.eventId);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      {notice ? <GuestSuccessNotice notice={notice} /> : null}

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-headline-lg text-[2.35rem] font-normal leading-tight tracking-tight text-primary sm:text-[2.85rem]">
            Wedding Guests
          </h1>
          <p className="mt-1 max-w-2xl text-body-md leading-6 text-on-surface-variant">
            Keep individual guests and families organized, then choose the
            ceremonies each record can access.
          </p>
        </div>
        <Link
          href={addGuestHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-2.5 text-title-md font-semibold text-on-primary shadow-md shadow-primary/15 transition-colors hover:bg-primary-container sm:self-auto"
        >
          <UiIcon name="user-plus" className="h-4 w-4" />
          Add guest
        </Link>
      </section>

      <section
        aria-label="Guest overview"
        className="mt-5 overflow-x-auto rounded-2xl border border-primary/15 bg-secondary-fixed/60 shadow-sm"
      >
        <div className="grid min-w-[46rem] grid-cols-5">
          <SummaryMetric label="All records" value={result.summary.total} icon="badge" />
          <SummaryMetric label="Individuals" value={result.summary.individual} icon="user-check" />
          <SummaryMetric label="Family records" value={result.summary.family} icon="users" />
          <SummaryMetric label="Bride's side" value={result.summary.brideSide} accent="#99536c" />
          <SummaryMetric label="Groom's side" value={result.summary.groomSide} accent="#4e6b5c" last />
        </div>
      </section>

      <GuestDirectoryFilters
        key={`${query.q ?? ""}:${query.guestType ?? ""}:${query.tag ?? ""}:${query.eventId ?? ""}:${result.pageSize}`}
        filters={effectiveQuery}
        events={events.map((event) => ({ id: event.id, label: event.title.en }))}
      >
        {result.guests.length ? (
          <>
            <section className="mt-4 overflow-hidden rounded-2xl border border-outline-variant/60 bg-white shadow-sm" aria-label="Guest directory">
              <div className="hidden grid-cols-[minmax(15rem,1.7fr)_minmax(11rem,1fr)_minmax(12rem,1fr)_2.5rem] gap-4 border-b border-outline-variant/60 bg-surface-container-low px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-outline md:grid">
                <span>Guest or family</span><span>Contact</span><span>Invited ceremonies</span><span className="sr-only">Open</span>
              </div>
              <div className="divide-y divide-outline-variant/55">
                {result.guests.map((guest) => {
                  const assignedEvents = (result.eventIdsByGuest[guest.id] ?? [])
                    .map((eventId) => eventsById.get(eventId))
                    .filter((event) => event !== undefined);
                  return (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      eventLabels={assignedEvents.map((event) => event.title.en)}
                      timezone={wedding.timezone}
                      firstEventDate={assignedEvents[0]?.startAt}
                      returnTo={returnTo}
                    />
                  );
                })}
              </div>
            </section>
            <GuestPagination query={effectiveQuery} page={result.page} pageCount={result.pageCount} total={result.total} pageSize={result.pageSize} />
          </>
        ) : filtering ? (
          <NoResults />
        ) : (
          <EmptyDirectory addGuestHref={addGuestHref} />
        )}
      </GuestDirectoryFilters>
    </main>
  );
}

function GuestRow({ guest, eventLabels, timezone, firstEventDate, returnTo }: { guest: WeddingGuest; eventLabels: string[]; timezone: string; firstEventDate?: Date; returnTo: string }) {
  const palette = avatarPalette(guest.id);
  const contact = guest.primaryContact.email || guest.primaryContact.phone;
  return (
    <article>
      <Link href={buildGuestDetailsHref(guest.id, returnTo)} aria-label={`View ${guest.displayName.en}`} className="group grid gap-3 p-3.5 transition-colors hover:bg-surface-container-low/70 focus:bg-surface-container-low/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:grid-cols-[minmax(15rem,1.7fr)_minmax(11rem,1fr)_minmax(12rem,1fr)_2.5rem] md:items-center md:px-5 md:py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: palette.soft, color: palette.accent }}>{initials(guest.displayName.en)}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-title-md font-semibold text-on-surface group-hover:text-primary group-hover:underline">{guest.displayName.en}</h2>
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">{guest.guestType === "FAMILY" ? "Family" : "Individual"}</span>
            </div>
            {guest.guestType === "FAMILY" ? <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">Primary: {guest.primaryContact.name.en}</p> : null}
            <div className="mt-1.5 flex flex-wrap gap-1.5">{guest.tags.map((tag) => <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tag === "VIP" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-primary/8 text-primary"}`}>{GUEST_TAG_LABELS[tag]}</span>)}</div>
          </div>
        </div>
        <div className="min-w-0 text-body-sm text-on-surface-variant">
          {contact ? <p className="truncate">{contact}</p> : <p className="italic text-outline">No contact details</p>}
          {guest.primaryContact.email && guest.primaryContact.phone ? <p className="mt-0.5 truncate text-[12px] text-outline">{guest.primaryContact.phone}</p> : null}
        </div>
        <div className="min-w-0">
          <p className="text-body-sm font-semibold text-on-surface">{eventLabels.length} {eventLabels.length === 1 ? "ceremony" : "ceremonies"}</p>
          <p className="mt-0.5 truncate text-[12px] text-on-surface-variant">{eventLabels.length ? eventLabels.join(" · ") : "No ceremonies assigned"}</p>
          {firstEventDate ? <p className="mt-1 text-[11px] text-outline">From {formatEventDay(firstEventDate, timezone)}</p> : null}
        </div>
        <UiIcon name="arrow-right" className="hidden h-4 w-4 text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:block" />
      </Link>
    </article>
  );
}

function SummaryMetric({ label, value, icon, accent, last = false }: { label: string; value: number; icon?: "badge" | "users" | "user-check"; accent?: string; last?: boolean }) {
  return <article className={`flex min-h-[4.6rem] items-center gap-3 px-4 py-2.5 ${last ? "" : "border-r border-outline-variant/55"}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">{icon ? <UiIcon name={icon} className="h-4 w-4" /> : <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent }} />}</span><div className="min-w-0"><strong className="block text-xl leading-none text-on-surface">{value}</strong><p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-outline">{label}</p></div></article>;
}

function EmptyDirectory({ addGuestHref }: { addGuestHref: string }) {
  return <section className="mt-8 rounded-3xl border border-dashed border-outline-variant bg-white px-5 py-14 text-center shadow-sm sm:px-10 sm:py-20"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary"><UiIcon name="users" className="h-7 w-7" /></span><h2 className="mt-5 font-headline-lg text-3xl font-semibold text-on-surface">Start your wedding guest directory</h2><p className="mx-auto mt-3 max-w-xl text-body-md leading-7 text-on-surface-variant">Add an individual or family, keep their organizer notes private, and select the wedding events they are invited to.</p><Link href={addGuestHref} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-title-md font-semibold text-on-primary shadow-md hover:bg-primary-container"><UiIcon name="user-plus" className="h-4 w-4" />Add your first guest</Link></section>;
}

function NoResults() {
  return <section className="mt-8 rounded-3xl border border-dashed border-outline-variant bg-white px-5 py-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-primary"><UiIcon name="search" className="h-6 w-6" /></span><h2 className="mt-4 font-headline-lg text-2xl font-semibold text-on-surface">No guests match these filters</h2><p className="mt-2 text-body-md text-on-surface-variant">Try a different name, tag, type, or ceremony.</p><Link href="/app/guests" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-surface-container px-5 text-label-md font-semibold text-on-surface hover:bg-surface-container-high">Clear filters</Link></section>;
}

function parseQuery(raw: RawSearchParams): GuestListQuery {
  const parsed = guestListQuerySchema.safeParse({ q: first(raw.q), guestType: first(raw.guestType), tag: first(raw.tag), eventId: first(raw.eventId), page: first(raw.page), pageSize: first(raw.pageSize) });
  return parsed.success ? parsed.data : { page: 1, pageSize: 10 };
}

function parseNotice(value: string | string[] | undefined): GuestNotice | undefined {
  const notice = first(value);
  return notice === "guest-created" || notice === "guest-updated" || notice === "guest-removed" ? notice : undefined;
}

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function initials(value: string) { return value.trim().split(/\s+/u).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function avatarPalette(id: string): { accent: string; soft: string } {
  const palettes = [{ accent: "#702b45", soft: "#f5e7ec" }, { accent: "#a64f3b", soft: "#f8ece7" }, { accent: "#806015", soft: "#f7f0df" }, { accent: "#4e6b5c", soft: "#e8f0ec" }];
  const index = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}
