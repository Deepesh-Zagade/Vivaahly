import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/app/(organizer)/app/_components/dashboard-content";
import { getWorkspaceWedding } from "@/app/(organizer)/app/_components/workspace-data.server";
import { WorkspaceSuccessNotice } from "@/app/(organizer)/app/workspace-success-notice";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  formatEventDay,
  formatEventTimeRange,
} from "@/modules/events/event.presentation";
import { getEventService } from "@/modules/events/event.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";

export const metadata: Metadata = { title: "Organizer workspace" };
export const dynamic = "force-dynamic";

type OrganizerWorkspacePageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function OrganizerWorkspacePage({
  searchParams,
}: OrganizerWorkspacePageProps) {
  const [query, organizer] = await Promise.all([
    searchParams,
    requireCurrentOrganizer(),
  ]);

  if (!organizer.membership) redirect("/app/onboarding");

  const [wedding, management, events] = await Promise.all([
    getWorkspaceWedding(organizer.membership),
    (await getOrganizerService()).getOrganizerManagement(organizer),
    (await getEventService()).listEvents(organizer.membership),
  ]);
  const showDemoData =
    process.env.NODE_ENV === "development" ||
    process.env.DASHBOARD_DEMO_DATA === "true";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      {query.notice === "wedding-details-updated" ? (
        <WorkspaceSuccessNotice />
      ) : null}
      <DashboardContent
        organizerName={organizer.user.name}
        showDemoData={showDemoData}
        events={events.map((event) => ({
          id: event.id,
          title: event.title.en,
          dayLabel: formatEventDay(event.startAt, wedding.timezone),
          timeLabel: formatEventTimeRange(
            event.startAt,
            event.endAt,
            wedding.timezone,
          ),
          location:
            event.venue.name.en ??
            event.venue.address.en ??
            "Venue not added",
          upcoming: event.endAt >= new Date(),
        }))}
        members={management.members.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
        }))}
      />
    </main>
  );
}
