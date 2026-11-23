import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  InvitationHub,
  type InvitationHubItem,
} from "@/app/(organizer)/app/invitations/_components/invitation-hub";
import { requireCurrentOrganizer } from "@/modules/auth/auth.server";
import { getEventService } from "@/modules/events/event.server";
import { mapCampaignDto } from "@/modules/guest-invitations/guest-invitation.presentation";
import { invitationListQuerySchema } from "@/modules/guest-invitations/guest-invitation.schemas";
import { getGuestInvitationService } from "@/modules/guest-invitations/guest-invitation.server";
import type { InvitationListQuery } from "@/modules/guest-invitations/guest-invitation.types";

export const metadata: Metadata = { title: "Guest invitations" };
export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const [rawQuery, organizer] = await Promise.all([
    searchParams,
    requireCurrentOrganizer(),
  ]);
  if (!organizer.membership) redirect("/app/onboarding");

  const query = parseQuery(rawQuery);
  const [invitationService, eventService] = await Promise.all([
    getGuestInvitationService(),
    getEventService(),
  ]);
  const [result, events] = await Promise.all([
    invitationService.listHub(organizer.membership, query),
    eventService.listEvents(organizer.membership),
  ]);

  const canonicalPage = result.pageCount > 0 ? result.page : 1;
  if (canonicalPage !== query.page) {
    redirect(buildHref({ ...query, page: canonicalPage }));
  }

  const items: InvitationHubItem[] = result.invitations.map((item) => ({
    ...item,
    assignedEvents: item.assignedEvents.map((event) => ({
      ...event,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
    })),
    lastSentAt: item.lastSentAt?.toISOString() ?? null,
  }));

  return (
    <InvitationHub
      items={items}
      summary={result.summary}
      eligibleGuestIds={result.eligibleGuestIds}
      retryableGuestIds={result.retryableGuestIds}
      latestCampaign={result.latestCampaign ? mapCampaignDto(result.latestCampaign) : null}
      events={events.map((event) => ({ id: event.id, title: event.title.en }))}
      query={{ ...query, page: canonicalPage, pageSize: result.pageSize }}
      total={result.total}
      page={canonicalPage}
      pageCount={result.pageCount}
    />
  );
}

function parseQuery(raw: RawSearchParams): InvitationListQuery {
  const parsed = invitationListQuerySchema.safeParse({
    q: first(raw.q),
    status: first(raw.status),
    guestType: first(raw.guestType),
    eventId: first(raw.eventId),
    page: first(raw.page),
    pageSize: first(raw.pageSize),
  });
  return parsed.success ? parsed.data : { page: 1, pageSize: 10 };
}

function buildHref(query: InvitationListQuery) {
  const parameters = new URLSearchParams();
  if (query.q) parameters.set("q", query.q);
  if (query.status) parameters.set("status", query.status);
  if (query.guestType) parameters.set("guestType", query.guestType);
  if (query.eventId) parameters.set("eventId", query.eventId);
  if (query.page > 1) parameters.set("page", String(query.page));
  if (query.pageSize !== 10) parameters.set("pageSize", String(query.pageSize));
  return parameters.size ? `/app/invitations?${parameters}` : "/app/invitations";
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
