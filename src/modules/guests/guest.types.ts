export const GUEST_TAGS = [
  "BRIDE_SIDE",
  "GROOM_SIDE",
  "RELATIVES",
  "FRIENDS",
  "COLLEAGUES",
  "NEIGHBOURS",
  "VIP",
] as const;

export type GuestTag = (typeof GUEST_TAGS)[number];
export type GuestType = "INDIVIDUAL" | "FAMILY";
export type GuestStatus = "ACTIVE" | "REMOVED";

export const GUEST_TAG_LABELS: Record<GuestTag, string> = {
  BRIDE_SIDE: "Bride's Side",
  GROOM_SIDE: "Groom's Side",
  RELATIVES: "Relatives",
  FRIENDS: "Friends",
  COLLEAGUES: "Colleagues",
  NEIGHBOURS: "Neighbours",
  VIP: "VIP",
};

export type WeddingGuest = {
  id: string;
  weddingId: string;
  guestType: GuestType;
  displayName: { en: string; mr?: string };
  primaryContact: {
    name: { en: string; mr?: string };
    email?: string;
    phone?: string;
  };
  tags: GuestTag[];
  organizerNotes?: string;
  status: GuestStatus;
  deletedAt: Date | null;
  createdByMembershipId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GuestDto = Omit<
  WeddingGuest,
  "deletedAt" | "createdAt" | "updatedAt"
> & {
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuestListQuery = {
  q?: string;
  guestType?: GuestType;
  tag?: GuestTag;
  eventId?: string;
  page: number;
  pageSize: number;
};

export type GuestSummary = {
  total: number;
  individual: number;
  family: number;
  brideSide: number;
  groomSide: number;
};

export type GuestListResult = {
  guests: WeddingGuest[];
  eventIdsByGuest: Record<string, string[]>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  summary: GuestSummary;
};

export type GuestDetails = {
  guest: WeddingGuest;
  eventIds: string[];
};

export function mapGuestDto(guest: WeddingGuest): GuestDto {
  return {
    ...guest,
    deletedAt: guest.deletedAt?.toISOString() ?? null,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString(),
  };
}
