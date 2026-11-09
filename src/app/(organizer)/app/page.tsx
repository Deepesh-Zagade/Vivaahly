import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/app/(organizer)/app/_components/dashboard-content";
import { getWorkspaceWedding } from "@/app/(organizer)/app/_components/workspace-data.server";
import { WorkspaceSuccessNotice } from "@/app/(organizer)/app/workspace-success-notice";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
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

  const [wedding, management] = await Promise.all([
    getWorkspaceWedding(organizer.membership),
    (await getOrganizerService()).getOrganizerManagement(organizer),
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
        eventCount={wedding.counters.eventCount}
        members={management.members.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
        }))}
      />
    </main>
  );
}
