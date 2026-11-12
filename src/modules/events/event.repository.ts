import type {
  CreateEventInput,
  UpdateEventInput,
} from "@/modules/events/event.schemas";
import type { WeddingEvent } from "@/modules/events/event.types";

export class EventLimitReachedError extends Error {
  constructor() {
    super("This wedding already has 10 active events.");
    this.name = "EventLimitReachedError";
  }
}

export type CreateEventRecord = CreateEventInput & {
  weddingId: string;
  createdByMembershipId: string;
  createdAt: Date;
};

export type UpdateEventRecord = UpdateEventInput & {
  updatedAt: Date;
};

export interface EventRepository {
  findWeddingTimezone(weddingId: string): Promise<string | null>;
  listActiveByWeddingId(weddingId: string): Promise<WeddingEvent[]>;
  findActiveById(weddingId: string, eventId: string): Promise<WeddingEvent | null>;
  createWithCounter(input: CreateEventRecord): Promise<WeddingEvent>;
  updateActive(
    weddingId: string,
    eventId: string,
    input: UpdateEventRecord,
  ): Promise<WeddingEvent | null>;
  softDeleteWithCounter(
    weddingId: string,
    eventId: string,
    deletedAt: Date,
  ): Promise<boolean>;
}
