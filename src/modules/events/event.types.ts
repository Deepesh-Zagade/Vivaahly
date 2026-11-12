import type { LocalizedText } from "@/modules/wedding/wedding.types";

export type OptionalLocalizedText = {
  en?: string;
  mr?: string;
};

export type WeddingEventStatus = "ACTIVE" | "DELETED";

export type WeddingEvent = {
  id: string;
  weddingId: string;
  title: LocalizedText;
  description: OptionalLocalizedText;
  startAt: Date;
  endAt: Date;
  venue: {
    name: OptionalLocalizedText;
    address: OptionalLocalizedText;
    mapUrl?: string;
  };
  dressCode: OptionalLocalizedText;
  privateNotes?: string;
  sortOrder: number;
  status: WeddingEventStatus;
  deletedAt: Date | null;
  createdByMembershipId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WeddingEventDto = Omit<
  WeddingEvent,
  "startAt" | "endAt" | "deletedAt" | "createdAt" | "updatedAt"
> & {
  startAt: string;
  endAt: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function mapWeddingEventDto(event: WeddingEvent): WeddingEventDto {
  return {
    ...event,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    deletedAt: event.deletedAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
