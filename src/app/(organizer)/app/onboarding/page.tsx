import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WeddingOnboardingForm } from "@/app/(organizer)/app/onboarding/wedding-onboarding-form";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";

export const metadata: Metadata = {
  title: "Set up your wedding",
};

export const dynamic = "force-dynamic";

function dateInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default async function WeddingOnboardingPage() {
  const organizer = await requireCurrentOrganizer();

  if (organizer.membership) redirect("/app");

  return (
    <main className="flex-1 px-margin-mobile py-10 md:px-margin md:py-14">
      <WeddingOnboardingForm
        minimumWeddingDate={dateInTimezone("Asia/Kolkata")}
      />
    </main>
  );
}
