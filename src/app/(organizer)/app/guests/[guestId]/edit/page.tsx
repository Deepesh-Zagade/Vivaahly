import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GuestForm } from "@/app/(organizer)/app/guests/_components/guest-form";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { formatEventDay, formatEventTimeRange } from "@/modules/events/event.presentation";
import { getEventService } from "@/modules/events/event.server";
import { getGuestService } from "@/modules/guests/guest.server";
import {
  buildGuestDetailsHref,
  normalizeGuestDirectoryReturnTo,
} from "@/modules/guests/guest.navigation";
import { mapGuestDto } from "@/modules/guests/guest.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { ApplicationError } from "@/server/http/errors";

export const metadata: Metadata = { title: "Edit wedding guest" };
export const dynamic = "force-dynamic";

export default async function EditGuestPage({ params, searchParams }: { params: Promise<{ guestId: string }>; searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const [{ guestId }, organizer, query] = await Promise.all([params, requireCurrentOrganizer(), searchParams]);
  if (!organizer.membership) redirect("/app/onboarding");
  let details;
  try { details = await (await getGuestService()).getGuest(organizer.membership, guestId); }
  catch (error) { if (error instanceof ApplicationError && error.code === "NOT_FOUND") notFound(); throw error; }
  const [events, wedding] = await Promise.all([(await getEventService()).listEvents(organizer.membership), (await getWeddingService()).getWeddingForOrganizer(organizer.membership)]);
  const returnTo = normalizeGuestDirectoryReturnTo(query.returnTo);
  return <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><Link href={buildGuestDetailsHref(details.guest.id, returnTo)} className="group inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-on-surface-variant hover:text-primary"><UiIcon name="arrow-left" className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />Back to guest details</Link><div className="mb-5 mt-2"><h1 className="font-headline-lg text-[2.25rem] font-normal leading-tight tracking-tight text-primary sm:text-[2.75rem]">Edit guest details</h1><p className="mt-1 max-w-2xl text-body-md leading-6 text-on-surface-variant">Update this directory record, private notes, tags, or invited ceremonies.</p></div><GuestForm returnTo={returnTo} guest={mapGuestDto(details.guest)} assignedEventIds={details.eventIds} events={events.map((event) => ({ id: event.id, title: event.title.en, dayLabel: formatEventDay(event.startAt, wedding.timezone), timeLabel: formatEventTimeRange(event.startAt, event.endAt, wedding.timezone, false), location: event.venue.name.en || event.venue.address.en || undefined }))} /></main>;
}
