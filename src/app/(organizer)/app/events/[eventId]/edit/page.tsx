import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/app/(organizer)/app/events/_components/event-form";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getEventService } from "@/modules/events/event.server";
import { mapWeddingEventDto, type WeddingEvent } from "@/modules/events/event.types";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { ApplicationError } from "@/server/http/errors";

export const metadata: Metadata = { title: "Edit wedding event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const [{ eventId }, organizer] = await Promise.all([params, requireCurrentOrganizer()]);
  if (!organizer.membership) redirect("/app/onboarding");

  let event: WeddingEvent;
  try {
    event = await (await getEventService()).getEvent(organizer.membership, eventId);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const wedding = await (await getWeddingService()).getWeddingForOrganizer(organizer.membership);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <Link href={`/app/events/${event.id}`} className="group inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-on-surface-variant transition-colors hover:text-primary">
        <UiIcon name="arrow-left" className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />
        Back to event details
      </Link>
      <div className="mb-8 mt-4">
        <h1 className="font-headline-lg text-[2.4rem] font-normal leading-tight tracking-tight text-primary sm:text-[3.25rem]">Edit wedding event</h1>
        <p className="mt-2 max-w-2xl text-body-lg leading-7 text-on-surface-variant">Update this ceremony while keeping organizer-only information private.</p>
      </div>
      <EventForm timezone={wedding.timezone} event={mapWeddingEventDto(event)} />
    </main>
  );
}
