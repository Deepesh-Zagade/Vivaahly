import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WeddingOnboardingForm } from "@/app/(organizer)/app/onboarding/wedding-onboarding-form";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { calendarDateInTimezone } from "@/shared/dates/calendar-date";

export const metadata: Metadata = {
  title: "Set up your wedding",
};

export const dynamic = "force-dynamic";

export default async function WeddingOnboardingPage() {
  const organizer = await requireCurrentOrganizer();

  if (organizer.membership) redirect("/app");

  return (
    <main className="flex-1 px-margin-mobile py-10 md:px-margin md:py-14">
      <WeddingOnboardingForm
        minimumWeddingDate={calendarDateInTimezone(
          new Date(),
          "Asia/Kolkata",
        )}
      />
    </main>
  );
}
