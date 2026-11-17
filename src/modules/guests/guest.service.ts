import "server-only";

import { randomBytes } from "node:crypto";
import type {
  AssignGuestEventsInput,
  GuestInput,
} from "@/modules/guests/guest.schemas";
import {
  GuestEventNotFoundError,
  type GuestRepository,
} from "@/modules/guests/guest.repository";
import type { GuestListQuery } from "@/modules/guests/guest.types";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import { notFoundError, validationError } from "@/server/http/errors";

type GuestServiceDependencies = {
  repository: GuestRepository;
  now?: () => Date;
  invitationKey?: () => string;
};

export class GuestService {
  private readonly repository: GuestRepository;
  private readonly now: () => Date;
  private readonly invitationKey: () => string;

  constructor({
    repository,
    now = () => new Date(),
    invitationKey = () => randomBytes(32).toString("base64url"),
  }: GuestServiceDependencies) {
    this.repository = repository;
    this.now = now;
    this.invitationKey = invitationKey;
  }

  listGuests(
    membership: OrganizerMembershipContext,
    query: GuestListQuery,
  ) {
    return this.repository.listActive(membership.weddingId, query);
  }

  getSummary(membership: OrganizerMembershipContext) {
    return this.repository.getSummary(membership.weddingId);
  }

  async getGuest(membership: OrganizerMembershipContext, guestId: string) {
    const details = await this.repository.findActiveById(
      membership.weddingId,
      guestId,
    );
    if (!details) throw notFoundError("Wedding guest not found.");
    return details;
  }

  createGuest(
    membership: OrganizerMembershipContext,
    input: GuestInput,
  ) {
    const createdAt = this.now();
    return this.repository.createWithInvitation({
      ...input,
      weddingId: membership.weddingId,
      createdByMembershipId: membership.id,
      accessKey: this.invitationKey(),
      createdAt,
    });
  }

  async updateGuest(
    membership: OrganizerMembershipContext,
    guestId: string,
    input: GuestInput,
  ) {
    const guest = await this.repository.updateActive(
      membership.weddingId,
      guestId,
      { ...input, updatedAt: this.now() },
    );
    if (!guest) throw notFoundError("Wedding guest not found.");
    return guest;
  }

  async assignEvents(
    membership: OrganizerMembershipContext,
    guestId: string,
    input: AssignGuestEventsInput,
  ) {
    try {
      const updated = await this.repository.replaceEventAssignments(
        membership.weddingId,
        guestId,
        input.eventIds,
        this.now(),
      );
      if (!updated) throw notFoundError("Wedding guest not found.");
    } catch (error) {
      if (error instanceof GuestEventNotFoundError) {
        throw validationError(error.message, {
          fieldErrors: { eventIds: [error.message] },
        });
      }
      throw error;
    }
  }

  async removeGuest(
    membership: OrganizerMembershipContext,
    guestId: string,
  ) {
    const removed = await this.repository.softRemoveWithAccess(
      membership.weddingId,
      guestId,
      this.now(),
    );
    if (!removed) throw notFoundError("Wedding guest not found.");
  }

  assignmentCounts(
    membership: OrganizerMembershipContext,
    eventIds: string[],
  ) {
    return this.repository.countActiveAssignmentsByEvent(
      membership.weddingId,
      eventIds,
    );
  }
}
