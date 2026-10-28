import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ORGANIZER_SESSION_COOKIE } from "@/modules/auth/auth.server";
import { SiteHeader } from "./_components/site-header";
import { SiteFooter } from "./_components/site-footer";
import { HeroSection } from "./_components/sections/hero";
import { CoordinationSection } from "./_components/sections/coordination";
import { WorkspaceSection } from "./_components/sections/workspace";
import { CeremoniesSection } from "./_components/sections/ceremonies";
import { GuestsSection } from "./_components/sections/guests";
import { TasksSection } from "./_components/sections/tasks";
import { ExpensesSection } from "./_components/sections/expenses";
import { GuestExperienceSection } from "./_components/sections/guest-experience";
import { CultureSection } from "./_components/sections/culture";
import { MediaSection } from "./_components/sections/media";
import { PrivacySection } from "./_components/sections/privacy";
import { OverviewSection } from "./_components/sections/overview";
import { ClosingSection } from "./_components/sections/closing";

export const metadata: Metadata = {
  title: { absolute: "Vivaahly — Your wedding, beautifully organized" },
  description:
    "Bring wedding events, guests, RSVPs, family tasks, vendors, expenses, and shared memories into one calm workspace. Built for Indian weddings.",
};

export default async function MarketingPage() {
  const hasOrganizerSession = (await cookies()).has(ORGANIZER_SESSION_COOKIE);

  return (
    <div id="top" className="marketing-page">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-6 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader hasOrganizerSession={hasOrganizerSession} />
      <main id="main-content" tabIndex={-1}>
        <HeroSection hasOrganizerSession={hasOrganizerSession} />
        <CoordinationSection />
        <WorkspaceSection />
        <CeremoniesSection />
        <GuestsSection />
        <TasksSection />
        <ExpensesSection />
        <GuestExperienceSection />
        <CultureSection />
        <MediaSection />
        <PrivacySection />
        <OverviewSection />
        <ClosingSection hasOrganizerSession={hasOrganizerSession} />
      </main>
      <SiteFooter />
    </div>
  );
}
