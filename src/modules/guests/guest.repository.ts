import type { GuestInput } from "@/modules/guests/guest.schemas";
import type {
  GuestDetails,
  GuestListQuery,
  GuestListResult,
  GuestSummary,
  WeddingGuest,
} from "@/modules/guests/guest.types";

export class GuestEventNotFoundError extends Error {
  constructor() {
    super("One or more selected wedding events are unavailable.");
    this.name = "GuestEventNotFoundError";
  }
}

export type CreateGuestRecord = GuestInput & {
  weddingId: string;
  createdByMembershipId: string;
  accessKey: string;
  createdAt: Date;
};

export type UpdateGuestRecord = GuestInput & { updatedAt: Date };

export interface GuestRepository {
  listActive(weddingId: string, query: GuestListQuery): Promise<GuestListResult>;
  getSummary(weddingId: string): Promise<GuestSummary>;
  findActiveById(weddingId: string, guestId: string): Promise<GuestDetails | null>;
  createWithInvitation(input: CreateGuestRecord): Promise<WeddingGuest>;
  updateActive(
    weddingId: string,
    guestId: string,
    input: UpdateGuestRecord,
  ): Promise<WeddingGuest | null>;
  replaceEventAssignments(
    weddingId: string,
    guestId: string,
    eventIds: string[],
    updatedAt: Date,
  ): Promise<boolean>;
  softRemoveWithAccess(
    weddingId: string,
    guestId: string,
    removedAt: Date,
  ): Promise<boolean>;
  countActiveAssignmentsByEvent(
    weddingId: string,
    eventIds: string[],
  ): Promise<Record<string, number>>;
}
