import type { Metadata } from "next";
import { OrganizerInvitationAcceptance } from "@/app/(invitation)/join/[token]/organizer-invitation-acceptance";
import { getCurrentOrganizer } from "@/modules/auth/auth.server";
import { getOrganizerService } from "@/modules/organizers/organizer.server";

export const metadata: Metadata = {
  title: "Organizer invitation",
  description: "Review a private Vivaahly wedding organizer invitation.",
};
export const dynamic = "force-dynamic";

export default async function OrganizerInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const organizer = await getCurrentOrganizer();
  const access = await (await getOrganizerService()).getInvitationAccess(token, organizer);
  const accessContextKey = `${access.state}:${access.invitation?.signedInEmail ?? "signed-out"}`;
  return <OrganizerInvitationAcceptance key={accessContextKey} token={token} initialAccess={access} />;
}
