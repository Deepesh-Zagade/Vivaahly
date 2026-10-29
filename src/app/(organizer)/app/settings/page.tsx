import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WeddingSettingsForm } from "@/app/(organizer)/app/settings/wedding-settings-form";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getWeddingService } from "@/modules/wedding/wedding.server";
import { mapWeddingDto } from "@/modules/wedding/wedding.types";

export const metadata: Metadata = {
  title: "Wedding details",
};

export const dynamic = "force-dynamic";

export default async function WeddingSettingsPage() {
  const organizer = await requireCurrentOrganizer();

  if (!organizer.membership) redirect("/app/onboarding");

  const service = await getWeddingService();
  const wedding = await service.getWeddingForOrganizer(organizer.membership);
  const editingState = service.getWeddingEditingState(wedding);

  return (
    <main className="flex-1 px-margin-mobile py-10 md:px-margin md:py-14">
      <WeddingSettingsForm
        wedding={mapWeddingDto(wedding)}
        editable={editingState.editable}
        minimumWeddingDate={editingState.today}
      />
    </main>
  );
}
