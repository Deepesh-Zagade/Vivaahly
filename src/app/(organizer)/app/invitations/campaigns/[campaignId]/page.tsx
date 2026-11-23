import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CampaignProgress } from "@/app/(organizer)/app/invitations/campaigns/[campaignId]/_components/campaign-progress";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import {
  mapCampaignDto,
  mapCampaignRecipientDto,
} from "@/modules/guest-invitations/guest-invitation.presentation";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import { ApplicationError } from "@/server/http/errors";

export const metadata: Metadata = { title: "Invitation delivery" };
export const dynamic = "force-dynamic";
const RECIPIENT_PAGE_SIZE = 100;

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [organizer, route, query] = await Promise.all([
    requireCurrentOrganizer(),
    params,
    searchParams,
  ]);
  if (!organizer.membership) redirect("/app/onboarding");
  const service = await getGuestInvitationService();
  const requestedRecipientPage = positiveInteger(first(query.recipientPage));
  let campaign;
  let recipients;
  try {
    [campaign, recipients] = await Promise.all([
      service.getCampaign(organizer.membership, route.campaignId),
      service.listRecipients(organizer.membership, route.campaignId, {
        page: requestedRecipientPage,
        pageSize: RECIPIENT_PAGE_SIZE,
      }),
    ]);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
  const pageCount = Math.max(1, Math.ceil(recipients.total / RECIPIENT_PAGE_SIZE));
  const recipientPage = Math.min(requestedRecipientPage, pageCount);
  if (recipientPage !== requestedRecipientPage) {
    recipients = await service.listRecipients(organizer.membership, route.campaignId, {
      page: recipientPage,
      pageSize: RECIPIENT_PAGE_SIZE,
    });
  }
  return (
    <CampaignProgress
      initialCampaign={mapCampaignDto(campaign)}
      initialRecipients={recipients.recipients.map(mapCampaignRecipientDto)}
      initialRecipientTotal={recipients.total}
      initialRecipientPage={recipientPage}
      recipientPageSize={RECIPIENT_PAGE_SIZE}
      autoStart={first(query.start) === "1"}
    />
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
