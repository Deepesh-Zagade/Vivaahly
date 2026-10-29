import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  coupleDisplayName,
  titleMatchesCoupleNames,
} from "@/modules/wedding/wedding.presentation";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { WorkspaceSuccessNotice } from "@/app/(organizer)/app/workspace-success-notice";

export const metadata: Metadata = {
  title: "Organizer workspace",
};

export const dynamic = "force-dynamic";

type OrganizerWorkspacePageProps = {
  searchParams: Promise<{ notice?: string | string[] }>;
};

export default async function OrganizerWorkspacePage({
  searchParams,
}: OrganizerWorkspacePageProps) {
  const query = await searchParams;
  const organizer = await requireCurrentOrganizer();

  if (!organizer.membership) redirect("/app/onboarding");

  const wedding = await (
    await getWeddingService()
  ).getWeddingForOrganizer(organizer.membership);
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(wedding.mainWeddingDate);
  const coupleHeading = coupleDisplayName(
    wedding.couple.groom.name.en,
    wedding.couple.bride.name.en,
  );
  const hasCustomTitle = !titleMatchesCoupleNames(
    wedding.title.en,
    wedding.couple.groom.name.en,
    wedding.couple.bride.name.en,
  );

  return (
    <main className="flex-1 px-margin-mobile py-10 md:px-margin md:py-14">
      <section className="mx-auto max-w-7xl" aria-labelledby="workspace-heading">
        <p className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1.5 text-label-sm font-semibold uppercase tracking-[0.12em] text-primary">
          <span className="h-2 w-2 rounded-full bg-secondary" />
          Organizer workspace
        </p>
        <h1 id="workspace-heading" className="mt-4 font-headline-lg text-[2.6rem] leading-tight tracking-tight text-on-surface sm:text-[3.3rem]">
          Welcome, {organizer.user.name}.
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg leading-8 text-on-surface-variant">
          Your wedding workspace is ready. Future planning features will build from this private wedding context.
        </p>

        {query.notice === "wedding-details-updated" ? (
          <WorkspaceSuccessNotice />
        ) : null}

        <article className="relative mt-9 max-w-4xl overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_18px_45px_rgba(44,28,33,0.08)] sm:p-9">
          <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <p className="text-label-sm font-semibold uppercase tracking-[0.12em] text-secondary">Active wedding</p>
              {hasCustomTitle ? (
                <p className="mt-3 font-headline-lg text-[1.65rem] italic leading-snug text-secondary sm:text-[1.9rem]">
                  {wedding.title.en}
                </p>
              ) : null}
              <h2 className={`${hasCustomTitle ? "mt-1" : "mt-2"} font-headline-lg text-[2.2rem] leading-tight text-primary sm:text-[2.7rem]`}>
                {coupleHeading}
              </h2>
            </div>
            <span className="self-start rounded-full bg-primary-fixed px-3 py-1.5 text-label-sm font-semibold uppercase tracking-wide text-on-primary-fixed">{organizer.membership.role}</span>
          </div>

          <dl className="mt-7 grid gap-5 border-t border-outline-variant/70 pt-6 sm:grid-cols-3">
            <WorkspaceDetail label="Main wedding date" value={formattedDate} />
            <WorkspaceDetail label="Wedding location" value={wedding.primaryVenue.city.en} />
            <WorkspaceDetail label="Timezone" value={wedding.timezone} />
          </dl>

          <div className="mt-7 flex border-t border-outline-variant/70 pt-5 sm:justify-end">
            <Link
              href="/app/settings"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-container sm:w-auto"
            >
              Edit wedding details
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

function WorkspaceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-sm font-semibold uppercase tracking-[0.1em] text-outline">{label}</dt>
      <dd className="mt-1.5 text-title-md font-semibold text-on-surface">{value}</dd>
    </div>
  );
}
