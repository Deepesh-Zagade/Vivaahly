import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizerManagement } from "@/app/(organizer)/app/organizers/organizer-management";
import { UiIcon } from "@/components/ui-icon";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";

export const metadata: Metadata = { title: "Wedding organizers" };
export const dynamic = "force-dynamic";

export default async function OrganizersPage() {
  const organizer = await requireCurrentOrganizer();
  if (!organizer.membership) redirect("/app/onboarding");
  const management = await (await getOrganizerService()).getOrganizerManagement(organizer);

  return (
    <>
      <main className="flex-1 px-margin-mobile py-6 md:px-margin md:py-10">
        <section className="mx-auto max-w-7xl">
        <Link
          href="/app"
          className="group inline-flex min-h-10 items-center gap-2 text-label-md font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <UiIcon name="arrow-left" className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />
          Back to workspace
        </Link>
        <div className="mt-5 max-w-3xl space-y-1">
          <p className="flex items-center gap-2 text-label-sm font-semibold uppercase tracking-[0.14em] text-secondary">
            <span>• Wedding workspace</span><span className="text-outline-variant">•</span><span>Organizers</span>
          </p>
          <h1 className="font-headline-lg text-[2.3rem] font-normal leading-[1.12] tracking-tight text-primary sm:text-[3.5rem]">
            Your wedding team
          </h1>
          <p className="max-w-3xl text-body-lg leading-8 text-on-surface-variant">
            Invite trusted family members and friends to help plan and manage the celebration with peace of mind.
          </p>
        </div>

        <OrganizerManagement
          currentUserId={organizer.user.id}
          canManage={management.canManage}
          members={management.members.map((member) => ({
            ...member,
            joinedAt: member.joinedAt.toISOString(),
          }))}
          invitations={management.invitations.map((invitation) => ({
            ...invitation,
            expiresAt: invitation.expiresAt?.toISOString() ?? null,
            createdAt: invitation.createdAt.toISOString(),
          }))}
        />
        </section>
      </main>
      <footer className="border-t border-outline-variant/60 bg-surface-container-lowest px-margin-mobile py-5 text-center text-body-sm text-on-surface-variant md:px-margin">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>© {new Date().getFullYear()} Vivaahly. Thoughtful multi-generational wedding logistics.</span>
          <span>Private wedding planning for the people you trust.</span>
        </div>
      </footer>
    </>
  );
}
