import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventForm } from "@/app/(organizer)/app/events/_components/event-form";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getEventService } from "@/modules/events/event.server";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { calendarDateInTimezone } from "@/shared/dates/calendar-date";

export const metadata: Metadata = { title: "Create wedding event" };
export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const organizer = await requireCurrentOrganizer();
  if (!organizer.membership) redirect("/app/onboarding");
  const [events, wedding] = await Promise.all([
    (await getEventService()).listEvents(organizer.membership),
    (await getWeddingService()).getWeddingForOrganizer(organizer.membership),
  ]);
  if (events.length >= 10) redirect("/app/events");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <Link href="/app/events" className="group inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-on-surface-variant transition-colors hover:text-primary">
        <UiIcon name="arrow-left" className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />
        Back to Wedding Events
      </Link>
      <div className="mb-8 mt-4">
        <h1 className="font-headline-lg text-[2.4rem] font-normal leading-tight tracking-tight text-primary sm:text-[3.25rem]">Create wedding event</h1>
        <p className="mt-2 max-w-2xl text-body-lg leading-7 text-on-surface-variant">Add a ceremony to your family&apos;s shared celebration schedule.</p>
      </div>
      <EventForm
        timezone={wedding.timezone}
        minimumEventDate={calendarDateInTimezone(
          new Date(),
          wedding.timezone,
        )}
      />
    </main>
  );
}
