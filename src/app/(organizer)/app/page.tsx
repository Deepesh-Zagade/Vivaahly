import type { Metadata } from "next";
import { getCurrentOrganizer } from "@/modules/auth/auth.server";

export const metadata: Metadata = {
  title: "Organizer workspace",
};

export const dynamic = "force-dynamic";

export default async function OrganizerWorkspacePage() {
  const organizer = await getCurrentOrganizer();

  return (
    <main className="px-margin-mobile py-14 md:px-margin md:py-20">
      <section className="mx-auto max-w-5xl">
        <div className="max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-7 shadow-[0_12px_32px_rgba(44,28,33,0.08)] sm:p-10">
          <p className="text-label-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Organizer workspace
          </p>
          <h1 className="mt-3 font-headline-lg text-[2.5rem] leading-tight tracking-tight sm:text-[3rem]">
            Welcome, {organizer?.user.name}.
          </h1>
          <p className="mt-4 text-body-lg leading-8 text-on-surface-variant">
            Your private organizer account is ready. Creating your wedding and setting up the family
            workspace will be the next development slice.
          </p>
          <dl className="mt-8 grid gap-4 rounded-xl bg-surface-container-low p-5 sm:grid-cols-2">
            <div>
              <dt className="text-label-sm font-semibold uppercase tracking-wider text-outline">
                Signed in as
              </dt>
              <dd className="mt-1 break-words text-body-md font-semibold text-on-surface">
                {organizer?.user.email}
              </dd>
            </div>
            <div>
              <dt className="text-label-sm font-semibold uppercase tracking-wider text-outline">
                Wedding workspace
              </dt>
              <dd className="mt-1 text-body-md font-semibold text-on-surface">Not created yet</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
