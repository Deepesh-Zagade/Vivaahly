import { guestListQuerySchema } from "@/modules/guests/guest.schemas";
import type { GuestListQuery } from "@/modules/guests/guest.types";

export const GUEST_PAGE_SIZES = [10, 50, 100] as const;
export type GuestDirectoryNotice =
  | "guest-created"
  | "guest-updated"
  | "guest-removed";

export function buildGuestDirectoryHref(
  query: GuestListQuery,
  notice?: GuestDirectoryNotice,
) {
  const parameters = new URLSearchParams();
  if (query.q) parameters.set("q", query.q);
  if (query.guestType) parameters.set("guestType", query.guestType);
  if (query.tag) parameters.set("tag", query.tag);
  if (query.eventId) parameters.set("eventId", query.eventId);
  if (query.page > 1) parameters.set("page", String(query.page));
  if (query.pageSize !== 10) parameters.set("pageSize", String(query.pageSize));
  if (notice) parameters.set("notice", notice);
  const search = parameters.toString();
  return search ? `/app/guests?${search}` : "/app/guests";
}

export function normalizeGuestDirectoryReturnTo(
  value: string | string[] | undefined,
) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/app/guests";
  }

  try {
    const url = new URL(candidate, "https://vivaahly.local");
    if (url.origin !== "https://vivaahly.local" || url.pathname !== "/app/guests") {
      return "/app/guests";
    }
    const parsed = guestListQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      guestType: url.searchParams.get("guestType") ?? undefined,
      tag: url.searchParams.get("tag") ?? undefined,
      eventId: url.searchParams.get("eventId") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    return parsed.success ? buildGuestDirectoryHref(parsed.data) : "/app/guests";
  } catch {
    return "/app/guests";
  }
}

export function buildGuestDetailsHref(
  guestId: string,
  returnTo: string,
  notice?: Exclude<GuestDirectoryNotice, "guest-removed">,
) {
  const parameters = new URLSearchParams({ returnTo });
  if (notice) parameters.set("notice", notice);
  return `/app/guests/${guestId}?${parameters.toString()}`;
}

export function buildGuestEditHref(guestId: string, returnTo: string) {
  return `/app/guests/${guestId}/edit?${new URLSearchParams({ returnTo })}`;
}

export function addGuestDirectoryNotice(
  returnTo: string,
  notice: GuestDirectoryNotice,
) {
  const normalized = normalizeGuestDirectoryReturnTo(returnTo);
  const url = new URL(normalized, "https://vivaahly.local");
  url.searchParams.set("notice", notice);
  return `${url.pathname}?${url.searchParams.toString()}`;
}
