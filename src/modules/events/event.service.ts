import "server-only";

import type {
  CreateEventInput,
  UpdateEventInput,
} from "@/modules/events/event.schemas";
import {
  EventLimitReachedError,
  type EventRepository,
} from "@/modules/events/event.repository";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import {
  conflictError,
  notFoundError,
  validationError,
} from "@/server/http/errors";
import { calendarDateInTimezone } from "@/shared/dates/calendar-date";

type EventServiceDependencies = {
  repository: EventRepository;
  now?: () => Date;
};

export class EventService {
  private readonly repository: EventRepository;
  private readonly now: () => Date;

  constructor({ repository, now = () => new Date() }: EventServiceDependencies) {
    this.repository = repository;
    this.now = now;
  }

  listEvents(membership: OrganizerMembershipContext) {
    return this.repository.listActiveByWeddingId(membership.weddingId);
  }

  async getEvent(membership: OrganizerMembershipContext, eventId: string) {
    const event = await this.repository.findActiveById(
      membership.weddingId,
      eventId,
    );
    if (!event) throw notFoundError("Wedding event not found.");
    return event;
  }

  async createEvent(
    membership: OrganizerMembershipContext,
    input: CreateEventInput,
  ) {
    const timezone = await this.repository.findWeddingTimezone(
      membership.weddingId,
    );
    if (!timezone) throw notFoundError("Wedding not found.");
    const eventDate = calendarDateInTimezone(new Date(input.startAt), timezone);
    const today = calendarDateInTimezone(this.now(), timezone);
    if (eventDate < today) {
      throw validationError("The event date cannot be in the past.", {
        fieldErrors: {
          startAt: ["Choose today or a future event date."],
        },
      });
    }

    try {
      return await this.repository.createWithCounter({
        ...input,
        weddingId: membership.weddingId,
        createdByMembershipId: membership.id,
        createdAt: this.now(),
      });
    } catch (error) {
      if (error instanceof EventLimitReachedError) {
        throw conflictError(
          "This wedding has reached the maximum of 10 active events.",
        );
      }
      throw error;
    }
  }

  async updateEvent(
    membership: OrganizerMembershipContext,
    eventId: string,
    input: UpdateEventInput,
  ) {
    const event = await this.repository.updateActive(
      membership.weddingId,
      eventId,
      { ...input, updatedAt: this.now() },
    );
    if (!event) throw notFoundError("Wedding event not found.");
    return event;
  }

  async removeEvent(membership: OrganizerMembershipContext, eventId: string) {
    const removed = await this.repository.softDeleteWithCounter(
      membership.weddingId,
      eventId,
      this.now(),
    );
    if (!removed) throw notFoundError("Wedding event not found.");
  }
}
