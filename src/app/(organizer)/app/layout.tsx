import { EB_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/(organizer)/app/_components/logout-button";
import { getWorkspaceWedding } from "@/app/(organizer)/app/_components/workspace-data.server";
import { WorkspaceShell } from "@/app/(organizer)/app/_components/workspace-shell";
import { Brand } from "@/components/brand";
import { getCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  coupleDisplayName,
  titleMatchesCoupleNames,
  weddingCountdown,
} from "@/modules/wedding/wedding.presentation";

const editorial = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-editorial",
});

const interfaceFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-interface",
});

export default async function OrganizerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const organizer = await getCurrentOrganizer();

  if (!organizer) redirect("/sign-in");

  if (organizer.membership) {
    const wedding = await getWorkspaceWedding(organizer.membership);
    const coupleName = coupleDisplayName(
      wedding.couple.groom.name.en,
      wedding.couple.bride.name.en,
    );
    const hasCustomTitle = !titleMatchesCoupleNames(
      wedding.title.en,
      wedding.couple.groom.name.en,
      wedding.couple.bride.name.en,
    );

    return (
      <div className={`${editorial.variable} ${interfaceFont.variable} organizer-page font-body-md antialiased md:h-screen md:overflow-hidden`}>
        <WorkspaceShell
          organizer={{
            name: organizer.user.name,
            role: organizer.membership.role,
          }}
          wedding={{
            coupleName,
            eyebrow: hasCustomTitle ? wedding.title.en : "The wedding celebration of",
            dateLabel: new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(wedding.mainWeddingDate),
            location: wedding.primaryVenue.city.en,
            countdownLabel: weddingCountdown(
              wedding.mainWeddingDate,
              wedding.timezone,
            ),
          }}
        >
          {children}
        </WorkspaceShell>
      </div>
    );
  }

  return (
    <div
      className={`${editorial.variable} ${interfaceFont.variable} organizer-page flex min-h-screen flex-col bg-surface font-body-md text-on-surface`}
    >
      <header className="sticky top-0 z-40 border-b border-surface-container-highest/80 bg-surface/95 px-margin-mobile py-4 backdrop-blur-md md:px-margin">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Brand href="/app" />
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <span className="max-w-48 truncate text-label-md font-semibold text-on-surface">
                {organizer.user.name}
              </span>
            </div>
            <span className="hidden h-6 w-px bg-outline-variant sm:block" />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
