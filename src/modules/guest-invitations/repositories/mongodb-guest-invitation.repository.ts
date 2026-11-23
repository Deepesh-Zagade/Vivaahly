import "server-only";

import { ObjectId, type Collection, type Db, type MongoClient, type WithId } from "mongodb";
import { classifyCampaignRecipientEligibility } from "@/modules/guest-invitations/guest-invitation.delivery";
import {
  GuestInvitationCampaignValidationError,
  PendingGuestInvitationCampaignError,
  type CreateCampaignRecord,
  type DeliveryResult,
  type GuestInvitationRepository,
} from "@/modules/guest-invitations/guest-invitation.repository";
import type {
  CampaignRecipient,
  EmailCampaignRecipientStatus,
  EmailCampaignStatus,
  GuestInvitationListItem,
  InvitationAccessContext,
  InvitationCampaignProgress,
  InvitationDeliveryStatus,
  InvitationEmailContext,
  InvitationEventSummary,
  InvitationHubResult,
  InvitationListQuery,
} from "@/modules/guest-invitations/guest-invitation.types";
import type { GuestTag, GuestType } from "@/modules/guests/guest.types";

type GuestDocument = {
  weddingId: ObjectId;
  guestType: GuestType;
  displayName: { en: string; mr?: string };
  primaryContact: {
    name: { en: string; mr?: string };
    email?: string;
    emailNormalized?: string;
    phone?: string;
  };
  tags: GuestTag[];
  status: "ACTIVE" | "REMOVED";
};

type GuestInvitationDocument = {
  weddingId: ObjectId;
  guestId: ObjectId;
  accessKey: string;
  status: "ACTIVE" | "REVOKED";
  lastSentAt?: Date;
  revokedAt: Date | null;
  restoredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type GuestEventInvitationDocument = {
  weddingId: ObjectId;
  guestId: ObjectId;
  guestInvitationId: ObjectId;
  eventId: ObjectId;
  invitationStatus: "ACTIVE" | "REMOVED";
};

type EventDocument = {
  weddingId: ObjectId;
  title: { en: string; mr?: string };
  startAt: Date;
  endAt: Date;
  venue: {
    name: { en?: string; mr?: string };
    address: { en?: string; mr?: string };
  };
  dressCode: { en?: string; mr?: string };
  status: "ACTIVE" | "DELETED";
};

type WeddingDocument = {
  status: "ACTIVE";
  couple: {
    bride: { name: { en: string; mr?: string } };
    groom: { name: { en: string; mr?: string } };
  };
  title: { en: string; mr?: string };
  mainWeddingDate: Date;
  timezone: string;
  primaryVenue: { city: { en: string; mr?: string } };
};

type EmailCampaignDocument = {
  weddingId: ObjectId;
  campaignType: "GUEST_INVITATION";
  status: EmailCampaignStatus;
  totalRecipients: number;
  createdByMembershipId: ObjectId;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EmailCampaignRecipientDocument = {
  weddingId: ObjectId;
  campaignId: ObjectId;
  guestId: ObjectId;
  guestInvitationId: ObjectId;
  guestNameSnapshot: string;
  emailSnapshot: string;
  status: EmailCampaignRecipientStatus;
  attemptCount: number;
  providerMessageId: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastAttemptAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RecipientCounts = { pending: number; sent: number; failed: number };

function validObjectIds(values: string[]) {
  return values.every((value) => ObjectId.isValid(value));
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function coupleName(wedding: WeddingDocument) {
  return [wedding.couple.groom.name.en, wedding.couple.bride.name.en]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" & ");
}

function mapEvent(document: WithId<EventDocument>): InvitationEventSummary {
  return {
    id: document._id.toHexString(),
    title: document.title,
    startAt: document.startAt,
    endAt: document.endAt,
    ...(document.venue.name.en ? { venueName: document.venue.name.en } : {}),
    ...(document.venue.address.en
      ? { venueAddress: document.venue.address.en }
      : {}),
    ...(document.dressCode.en ? { dressCode: document.dressCode.en } : {}),
  };
}

function mapCampaign(
  document: WithId<EmailCampaignDocument>,
  counts: RecipientCounts,
): InvitationCampaignProgress {
  return {
    id: document._id.toHexString(),
    status: document.status,
    totalRecipients: document.totalRecipients,
    ...counts,
    createdByMembershipId: document.createdByMembershipId.toHexString(),
    startedAt: document.startedAt,
    completedAt: document.completedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function mapRecipient(
  document: WithId<EmailCampaignRecipientDocument>,
): CampaignRecipient {
  return {
    id: document._id.toHexString(),
    campaignId: document.campaignId.toHexString(),
    guestId: document.guestId.toHexString(),
    guestInvitationId: document.guestInvitationId.toHexString(),
    guestName: document.guestNameSnapshot,
    emailSnapshot: document.emailSnapshot,
    status: document.status,
    attemptCount: document.attemptCount,
    providerMessageId: document.providerMessageId,
    lastErrorCode: document.lastErrorCode,
    lastErrorMessage: document.lastErrorMessage,
    lastAttemptAt: document.lastAttemptAt,
    sentAt: document.sentAt,
  };
}

function deriveDeliveryStatus(
  guest: WithId<GuestDocument>,
  invitation: WithId<GuestInvitationDocument> | undefined,
  latestRecipient: WithId<EmailCampaignRecipientDocument> | undefined,
  latestCampaign: WithId<EmailCampaignDocument> | undefined,
  assignedEventCount: number,
): InvitationDeliveryStatus {
  if (!invitation || invitation.status === "REVOKED") return "REVOKED";
  if (!assignedEventCount) return "NEEDS_EVENTS";
  if (!guest.primaryContact.email) return "MISSING_EMAIL";
  const recipientAfterRestore = Boolean(
    invitation.restoredAt &&
      latestRecipient &&
      latestRecipient.createdAt.getTime() >= invitation.restoredAt.getTime(),
  );
  if (
    recipientAfterRestore &&
    latestRecipient?.status === "PENDING" &&
    latestCampaign &&
    ["DRAFT", "SENDING", "PARTIAL"].includes(latestCampaign.status)
  ) {
    return "SENDING";
  }
  if (recipientAfterRestore && latestRecipient?.status === "FAILED") return "FAILED";
  if (recipientAfterRestore && latestRecipient?.status === "SENT") return "SENT";
  if (invitation.restoredAt) return "RESTORED";
  // Compatibility for invitations restored before `restoredAt` was introduced:
  // the key was rotated and `lastSentAt` cleared, while historical recipients remain SENT.
  if (!invitation.lastSentAt && latestRecipient?.status === "SENT") return "RESTORED";
  if (
    latestRecipient?.status === "PENDING" &&
    latestCampaign &&
    ["DRAFT", "SENDING", "PARTIAL"].includes(latestCampaign.status)
  ) {
    return "SENDING";
  }
  if (latestRecipient?.status === "FAILED") return "FAILED";
  if (latestRecipient?.status === "SENT" || invitation.lastSentAt) return "SENT";
  return "NOT_SENT";
}

export class MongoGuestInvitationRepository
  implements GuestInvitationRepository
{
  private readonly guests: Collection<GuestDocument>;
  private readonly invitations: Collection<GuestInvitationDocument>;
  private readonly eventInvitations: Collection<GuestEventInvitationDocument>;
  private readonly events: Collection<EventDocument>;
  private readonly weddings: Collection<WeddingDocument>;
  private readonly campaigns: Collection<EmailCampaignDocument>;
  private readonly recipients: Collection<EmailCampaignRecipientDocument>;

  constructor(
    private readonly client: MongoClient,
    database: Db,
  ) {
    this.guests = database.collection("guests");
    this.invitations = database.collection("guestInvitations");
    this.eventInvitations = database.collection("guestEventInvitations");
    this.events = database.collection("events");
    this.weddings = database.collection("weddings");
    this.campaigns = database.collection("emailCampaigns");
    this.recipients = database.collection("emailCampaignRecipients");
  }

  private async recipientCounts(
    weddingId: ObjectId,
    campaignId: ObjectId,
  ): Promise<RecipientCounts> {
    const grouped = await this.recipients
      .aggregate<{ _id: EmailCampaignRecipientStatus; count: number }>([
        { $match: { weddingId, campaignId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();
    const counts: RecipientCounts = { pending: 0, sent: 0, failed: 0 };
    for (const item of grouped) {
      if (item._id === "PENDING") counts.pending = item.count;
      if (item._id === "SENT") counts.sent = item.count;
      if (item._id === "FAILED") counts.failed = item.count;
    }
    return counts;
  }

  private async campaignProgress(document: WithId<EmailCampaignDocument>) {
    return mapCampaign(
      document,
      await this.recipientCounts(document.weddingId, document._id),
    );
  }

  async listHub(
    weddingId: string,
    query: InvitationListQuery,
  ): Promise<InvitationHubResult> {
    if (!ObjectId.isValid(weddingId)) {
      return {
        invitations: [],
        summary: {
          total: 0,
          notSent: 0,
          sending: 0,
          sent: 0,
          failed: 0,
          revoked: 0,
          missingEmail: 0,
          needsEvents: 0,
          restored: 0,
          eligibleToSend: 0,
        },
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: 0,
        eligibleGuestIds: [],
        retryableGuestIds: [],
        latestCampaign: null,
      };
    }
    const weddingObjectId = new ObjectId(weddingId);
    const guests = await this.guests
      .find({ weddingId: weddingObjectId, status: "ACTIVE" })
      .sort({ "displayName.en": 1, _id: 1 })
      .toArray();
    if (!guests.length) {
      const empty = await this.listHub("invalid", query);
      return empty;
    }
    const guestIds = guests.map((guest) => guest._id);
    const [invitations, assignments, latestRecipients, latestCampaignDocument] =
      await Promise.all([
        this.invitations
          .find({ weddingId: weddingObjectId, guestId: { $in: guestIds } })
          .toArray(),
        this.eventInvitations
          .find({
            weddingId: weddingObjectId,
            guestId: { $in: guestIds },
            invitationStatus: "ACTIVE",
          })
          .toArray(),
        this.recipients
          .aggregate<WithId<EmailCampaignRecipientDocument>>([
            { $match: { weddingId: weddingObjectId, guestId: { $in: guestIds } } },
            { $sort: { updatedAt: -1, _id: -1 } },
            { $group: { _id: "$guestId", document: { $first: "$$ROOT" } } },
            { $replaceRoot: { newRoot: "$document" } },
          ])
          .toArray(),
        this.campaigns.findOne(
          { weddingId: weddingObjectId },
          { sort: { createdAt: -1, _id: -1 } },
        ),
      ]);
    const eventIds = [...new Set(assignments.map((item) => item.eventId.toHexString()))];
    const events = eventIds.length
      ? await this.events
          .find({
            _id: { $in: eventIds.map((id) => new ObjectId(id)) },
            weddingId: weddingObjectId,
            status: "ACTIVE",
          })
          .sort({ startAt: 1, sortOrder: 1, _id: 1 } as never)
          .toArray()
      : [];
    const eventById = new Map(events.map((event) => [event._id.toHexString(), event]));
    const assignmentsByGuest = new Map<string, InvitationEventSummary[]>();
    for (const assignment of assignments) {
      const event = eventById.get(assignment.eventId.toHexString());
      if (!event) continue;
      const key = assignment.guestId.toHexString();
      assignmentsByGuest.set(key, [
        ...(assignmentsByGuest.get(key) ?? []),
        mapEvent(event),
      ]);
    }
    const invitationByGuest = new Map(
      invitations.map((item) => [item.guestId.toHexString(), item]),
    );
    const latestRecipientByGuest = new Map(
      latestRecipients.map((item) => [item.guestId.toHexString(), item]),
    );
    const campaignIds = [
      ...new Set(latestRecipients.map((item) => item.campaignId.toHexString())),
    ];
    const latestCampaigns = campaignIds.length
      ? await this.campaigns
          .find({ _id: { $in: campaignIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [];
    const campaignById = new Map(
      latestCampaigns.map((item) => [item._id.toHexString(), item]),
    );

    const allItems: GuestInvitationListItem[] = guests.map((guest) => {
      const key = guest._id.toHexString();
      const invitation = invitationByGuest.get(key);
      const latestRecipient = latestRecipientByGuest.get(key);
      const assignedEvents = assignmentsByGuest.get(key) ?? [];
      return {
        guestId: key,
        guestType: guest.guestType,
        displayName: guest.displayName,
        primaryContact: {
          name: guest.primaryContact.name,
          ...(guest.primaryContact.email ? { email: guest.primaryContact.email } : {}),
          ...(guest.primaryContact.phone ? { phone: guest.primaryContact.phone } : {}),
        },
        tags: guest.tags,
        invitationStatus: invitation?.status ?? "REVOKED",
        deliveryStatus: deriveDeliveryStatus(
          guest,
          invitation,
          latestRecipient,
          latestRecipient
            ? campaignById.get(latestRecipient.campaignId.toHexString())
            : undefined,
          assignedEvents.length,
        ),
        assignedEvents,
        lastSentAt: invitation?.lastSentAt ?? null,
        latestError: latestRecipient?.lastErrorMessage ?? null,
        latestCampaignId: latestRecipient?.campaignId.toHexString() ?? null,
      };
    });
    const summary = {
      total: allItems.length,
      notSent: allItems.filter((item) => item.deliveryStatus === "NOT_SENT").length,
      sending: allItems.filter((item) => item.deliveryStatus === "SENDING").length,
      sent: allItems.filter((item) => item.deliveryStatus === "SENT").length,
      failed: allItems.filter((item) => item.deliveryStatus === "FAILED").length,
      revoked: allItems.filter((item) => item.deliveryStatus === "REVOKED").length,
      missingEmail: allItems.filter((item) => item.deliveryStatus === "MISSING_EMAIL").length,
      needsEvents: allItems.filter((item) => item.deliveryStatus === "NEEDS_EVENTS").length,
      restored: allItems.filter((item) => item.deliveryStatus === "RESTORED").length,
      eligibleToSend: allItems.filter((item) => ["NOT_SENT", "FAILED", "RESTORED"].includes(item.deliveryStatus)).length,
    };
    const expression = query.q
      ? new RegExp(escapeRegularExpression(query.q), "iu")
      : null;
    const filtered = allItems.filter((item) => {
      if (query.status && item.deliveryStatus !== query.status) return false;
      if (query.guestType && item.guestType !== query.guestType) return false;
      if (query.eventId && !item.assignedEvents.some((event) => event.id === query.eventId)) {
        return false;
      }
      if (
        expression &&
        ![
          item.displayName.en,
          item.displayName.mr,
          item.primaryContact.name.en,
          item.primaryContact.name.mr,
          item.primaryContact.email,
        ].some((value) => value && expression.test(value))
      ) {
        return false;
      }
      return true;
    });
    const pageCount = filtered.length ? Math.ceil(filtered.length / query.pageSize) : 0;
    const page = pageCount ? Math.min(query.page, pageCount) : 1;
    const latestCampaign = latestCampaignDocument
      ? await this.campaignProgress(latestCampaignDocument)
      : null;
    return {
      invitations: filtered.slice((page - 1) * query.pageSize, page * query.pageSize),
      summary,
      total: filtered.length,
      page,
      pageSize: query.pageSize,
      pageCount,
      eligibleGuestIds: filtered
        .filter((item) => ["NOT_SENT", "FAILED", "RESTORED"].includes(item.deliveryStatus))
        .map((item) => item.guestId),
      retryableGuestIds: filtered
        .filter((item) => item.deliveryStatus === "FAILED")
        .map((item) => item.guestId),
      latestCampaign,
    };
  }

  async createCampaign(input: CreateCampaignRecord) {
    if (!ObjectId.isValid(input.weddingId) || !ObjectId.isValid(input.createdByMembershipId)) {
      throw new GuestInvitationCampaignValidationError(
        "The invitation campaign could not be prepared for this wedding.",
      );
    }
    const uniqueGuestIds = [...new Set(input.guestIds)];
    if (!validObjectIds(uniqueGuestIds)) {
      throw new GuestInvitationCampaignValidationError("Invalid guest selection.");
    }
    const weddingId = new ObjectId(input.weddingId);
    const guestIds = uniqueGuestIds.map((id) => new ObjectId(id));
    const [guests, invitations, pendingRecipients, assignments] = await Promise.all([
      this.guests
        .find({ _id: { $in: guestIds }, weddingId, status: "ACTIVE" })
        .toArray(),
      this.invitations
        .find({ guestId: { $in: guestIds }, weddingId, status: "ACTIVE" })
        .toArray(),
      this.recipients.countDocuments({
        weddingId,
        guestId: { $in: guestIds },
        status: "PENDING",
      }),
      this.eventInvitations
        .find({
          weddingId,
          guestId: { $in: guestIds },
          invitationStatus: "ACTIVE",
        })
        .toArray(),
    ]);
    if (guests.length !== guestIds.length || invitations.length !== guestIds.length) {
      throw new GuestInvitationCampaignValidationError(
        "One or more selected guests cannot receive an invitation.",
      );
    }
    if (pendingRecipients) {
      throw new PendingGuestInvitationCampaignError();
    }
    const assignedEventIds = [
      ...new Set(assignments.map((assignment) => assignment.eventId.toHexString())),
    ];
    const activeEvents = assignedEventIds.length
      ? await this.events
          .find({
            _id: { $in: assignedEventIds.map((id) => new ObjectId(id)) },
            weddingId,
            status: "ACTIVE",
          })
          .toArray()
      : [];
    const activeEventIds = new Set(
      activeEvents.map((event) => event._id.toHexString()),
    );
    const guestsWithEvents = new Set(
      assignments
        .filter((assignment) => activeEventIds.has(assignment.eventId.toHexString()))
        .map((assignment) => assignment.guestId.toHexString()),
    );
    if (guestIds.some((guestId) => !guestsWithEvents.has(guestId.toHexString()))) {
      throw new GuestInvitationCampaignValidationError(
        "Every selected guest must have at least one active ceremony assigned.",
      );
    }
    const invitationByGuest = new Map(
      invitations.map((item) => [item.guestId.toHexString(), item]),
    );
    for (const guest of guests) {
      if (!guest.primaryContact.email) {
        throw new GuestInvitationCampaignValidationError(
          "Every selected guest must have a primary email address.",
        );
      }
      const invitation = invitationByGuest.get(guest._id.toHexString());
      if (!input.resend && invitation?.lastSentAt) {
        throw new GuestInvitationCampaignValidationError(
          "Already-sent invitations require an explicit resend confirmation.",
        );
      }
    }
    const campaignId = new ObjectId();
    const document: EmailCampaignDocument = {
      weddingId,
      campaignType: "GUEST_INVITATION",
      status: "DRAFT",
      totalRecipients: guests.length,
      createdByMembershipId: new ObjectId(input.createdByMembershipId),
      startedAt: null,
      completedAt: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    const session = this.client.startSession();
    try {
      await session.withTransaction(async () => {
        await this.campaigns.insertOne({ _id: campaignId, ...document }, { session });
        await this.recipients.insertMany(
          guests.map((guest) => ({
            weddingId,
            campaignId,
            guestId: guest._id,
            guestInvitationId: invitationByGuest.get(guest._id.toHexString())!._id,
            guestNameSnapshot: guest.displayName.en,
            emailSnapshot: guest.primaryContact.email!,
            status: "PENDING" as const,
            attemptCount: 0,
            providerMessageId: null,
            lastErrorCode: null,
            lastErrorMessage: null,
            lastAttemptAt: null,
            sentAt: null,
            createdAt: input.createdAt,
            updatedAt: input.createdAt,
          })),
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return mapCampaign({ _id: campaignId, ...document }, {
      pending: guests.length,
      sent: 0,
      failed: 0,
    });
  }

  async getCampaign(weddingId: string, campaignId: string) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(campaignId)) return null;
    const document = await this.campaigns.findOne({
      _id: new ObjectId(campaignId),
      weddingId: new ObjectId(weddingId),
    });
    return document ? this.campaignProgress(document) : null;
  }

  async listCampaignRecipients(
    weddingId: string,
    campaignId: string,
    options: { status?: EmailCampaignRecipientStatus; page?: number; pageSize?: number } = {},
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(campaignId)) {
      return { recipients: [], total: 0 };
    }
    const filter = {
      weddingId: new ObjectId(weddingId),
      campaignId: new ObjectId(campaignId),
      ...(options.status ? { status: options.status } : {}),
    };
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 50;
    const [documents, total] = await Promise.all([
      this.recipients
        .find(filter)
        .sort({ createdAt: 1, _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      this.recipients.countDocuments(filter),
    ]);
    return { recipients: documents.map(mapRecipient), total };
  }

  async getPendingEmailContexts(
    weddingId: string,
    campaignId: string,
    limit: number,
  ): Promise<InvitationEmailContext[]> {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(campaignId)) return [];
    const weddingObjectId = new ObjectId(weddingId);
    const campaignObjectId = new ObjectId(campaignId);
    const [wedding, recipients] = await Promise.all([
      this.weddings.findOne({ _id: weddingObjectId, status: "ACTIVE" }),
      this.recipients
        .find({
          weddingId: weddingObjectId,
          campaignId: campaignObjectId,
          status: "PENDING",
        })
        .sort({ createdAt: 1, _id: 1 })
        .limit(limit)
        .toArray(),
    ]);
    if (!wedding || !recipients.length) return [];
    const guestIds = recipients.map((item) => item.guestId);
    const [guests, invitations, assignments] = await Promise.all([
      this.guests
        .find({ _id: { $in: guestIds }, weddingId: weddingObjectId, status: "ACTIVE" })
        .toArray(),
      this.invitations
        .find({
          _id: { $in: recipients.map((item) => item.guestInvitationId) },
          weddingId: weddingObjectId,
          status: "ACTIVE",
        })
        .toArray(),
      this.eventInvitations
        .find({
          guestId: { $in: guestIds },
          weddingId: weddingObjectId,
          invitationStatus: "ACTIVE",
        })
        .toArray(),
    ]);
    const guestById = new Map(guests.map((item) => [item._id.toHexString(), item]));
    const invitationById = new Map(
      invitations.map((item) => [item._id.toHexString(), item]),
    );
    const eventIds = [...new Set(assignments.map((item) => item.eventId.toHexString()))];
    const events = eventIds.length
      ? await this.events
          .find({
            _id: { $in: eventIds.map((id) => new ObjectId(id)) },
            weddingId: weddingObjectId,
            status: "ACTIVE",
          })
          .sort({ startAt: 1, sortOrder: 1, _id: 1 } as never)
          .toArray()
      : [];
    const eventById = new Map(events.map((item) => [item._id.toHexString(), item]));
    const eventsByGuest = new Map<string, InvitationEventSummary[]>();
    for (const assignment of assignments) {
      const event = eventById.get(assignment.eventId.toHexString());
      if (!event) continue;
      const key = assignment.guestId.toHexString();
      eventsByGuest.set(key, [...(eventsByGuest.get(key) ?? []), mapEvent(event)]);
    }
    const eligibility = classifyCampaignRecipientEligibility(
      recipients.map((recipient) => ({
        recipientId: recipient._id.toHexString(),
        guestId: recipient.guestId.toHexString(),
        invitationId: recipient.guestInvitationId.toHexString(),
      })),
      new Set(guestById.keys()),
      new Set(invitationById.keys()),
      new Set(eventsByGuest.keys()),
    );
    const now = new Date();
    const markUnavailable = async (
      recipientIds: Set<string>,
      errorCode: string,
      errorMessage: string,
    ) => {
      if (!recipientIds.size) return;
      await this.recipients.updateMany(
        {
          _id: { $in: [...recipientIds].map((id) => new ObjectId(id)) },
          status: "PENDING",
        },
        {
          $set: {
            status: "FAILED",
            lastErrorCode: errorCode,
            lastErrorMessage: errorMessage,
            lastAttemptAt: now,
            updatedAt: now,
          },
          $inc: { attemptCount: 1 },
        },
      );
    };
    await Promise.all([
      markUnavailable(
        eligibility.unavailableRecipientIds,
        "RECIPIENT_UNAVAILABLE",
        "The guest or invitation access is no longer active.",
      ),
      markUnavailable(
        eligibility.recipientIdsWithoutEvents,
        "NO_ACTIVE_EVENTS",
        "Assign at least one active ceremony before sending this invitation.",
      ),
    ]);
    return recipients.flatMap((recipient) => {
      if (!eligibility.sendableRecipientIds.has(recipient._id.toHexString())) return [];
      const guest = guestById.get(recipient.guestId.toHexString())!;
      const invitation = invitationById.get(recipient.guestInvitationId.toHexString())!;
      return [{
        recipientId: recipient._id.toHexString(),
        campaignId,
        guestId: guest._id.toHexString(),
        guestInvitationId: invitation._id.toHexString(),
        accessKey: invitation.accessKey,
        attemptCount: recipient.attemptCount,
        recipientEmail: recipient.emailSnapshot,
        guestName: guest.displayName.en,
        primaryContactName: guest.primaryContact.name.en,
        guestType: guest.guestType,
        coupleName: coupleName(wedding),
        weddingTitle: wedding.title.en,
        weddingDate: wedding.mainWeddingDate,
        weddingTimezone: wedding.timezone,
        weddingCity: wedding.primaryVenue.city.en,
        events: eventsByGuest.get(guest._id.toHexString())!,
      }];
    });
  }

  async markCampaignSending(weddingId: string, campaignId: string, now: Date) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(campaignId)) return false;
    const result = await this.campaigns.updateOne(
      {
        _id: new ObjectId(campaignId),
        weddingId: new ObjectId(weddingId),
        status: { $in: ["DRAFT", "SENDING", "PARTIAL"] },
      },
      {
        $set: { status: "SENDING", updatedAt: now },
      },
    );
    if (result.matchedCount) {
      await this.campaigns.updateOne(
        { _id: new ObjectId(campaignId), startedAt: null },
        { $set: { startedAt: now } },
      );
    }
    return result.matchedCount === 1;
  }

  private async refreshCampaignProgress(
    weddingId: ObjectId,
    campaignId: ObjectId,
    now: Date,
  ) {
    const counts = await this.recipientCounts(weddingId, campaignId);
    const status: EmailCampaignStatus = counts.pending
      ? "SENDING"
      : counts.failed && counts.sent
        ? "PARTIAL"
        : counts.failed
          ? "FAILED"
          : "COMPLETED";
    const document = await this.campaigns.findOneAndUpdate(
      { _id: campaignId, weddingId },
      {
        $set: {
          status,
          updatedAt: now,
          completedAt: counts.pending ? null : now,
        },
      },
      { returnDocument: "after" },
    );
    return document ? mapCampaign(document, counts) : null;
  }

  async recordDeliveryResults(
    weddingId: string,
    campaignId: string,
    results: DeliveryResult[],
    now: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(campaignId)) return null;
    const weddingObjectId = new ObjectId(weddingId);
    const campaignObjectId = new ObjectId(campaignId);
    const session = this.client.startSession();
    try {
      await session.withTransaction(async () => {
        for (const result of results) {
          if (!ObjectId.isValid(result.recipientId)) continue;
          const recipient = await this.recipients.findOneAndUpdate(
            {
              _id: new ObjectId(result.recipientId),
              weddingId: weddingObjectId,
              campaignId: campaignObjectId,
              status: "PENDING",
            },
            {
              $set: result.sent
                ? {
                    status: "SENT",
                    providerMessageId: result.providerMessageId ?? null,
                    lastErrorCode: null,
                    lastErrorMessage: null,
                    lastAttemptAt: now,
                    sentAt: now,
                    updatedAt: now,
                  }
                : {
                    status: "FAILED",
                    providerMessageId: null,
                    lastErrorCode: result.errorCode ?? "SEND_FAILED",
                    lastErrorMessage:
                      result.errorMessage ?? "Vivaahly could not send this invitation.",
                    lastAttemptAt: now,
                    sentAt: null,
                    updatedAt: now,
                  },
              $inc: { attemptCount: 1 },
            },
            { session, returnDocument: "after" },
          );
          if (result.sent && recipient) {
            await this.invitations.updateOne(
              {
                _id: recipient.guestInvitationId,
                weddingId: weddingObjectId,
                status: "ACTIVE",
              },
              {
                $set: { lastSentAt: now, updatedAt: now },
                $unset: { restoredAt: "" },
              },
              { session },
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }
    return this.refreshCampaignProgress(weddingObjectId, campaignObjectId, now);
  }

  async createRetryCampaign(
    weddingId: string,
    campaignId: string,
    createdByMembershipId: string,
    now: Date,
  ) {
    if (
      !ObjectId.isValid(weddingId) ||
      !ObjectId.isValid(campaignId) ||
      !ObjectId.isValid(createdByMembershipId)
    ) return null;
    const weddingObjectId = new ObjectId(weddingId);
    const campaignObjectId = new ObjectId(campaignId);
    const sourceCampaign = await this.campaigns.findOne({
      _id: campaignObjectId,
      weddingId: weddingObjectId,
    });
    if (!sourceCampaign) return null;
    const failedGuestIds = await this.recipients.distinct("guestId", {
      weddingId: weddingObjectId,
      campaignId: campaignObjectId,
      status: "FAILED",
    });
    if (!failedGuestIds.length) return null;
    const failedGuestIdSet = new Set(
      failedGuestIds.map((guestId) => guestId.toHexString()),
    );
    const currentFailed = await this.listHub(weddingId, {
      status: "FAILED",
      page: 1,
      pageSize: 1_000,
    });
    const retryableGuestIds = currentFailed.invitations
      .map((item) => item.guestId)
      .filter((guestId) => failedGuestIdSet.has(guestId));
    if (!retryableGuestIds.length) return null;
    return this.createCampaign({
      weddingId,
      guestIds: retryableGuestIds,
      resend: true,
      createdByMembershipId,
      createdAt: now,
    });
  }

  async revokeInvitation(weddingId: string, guestId: string, now: Date) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return false;
    const result = await this.invitations.updateOne(
      {
        weddingId: new ObjectId(weddingId),
        guestId: new ObjectId(guestId),
        status: "ACTIVE",
      },
      { $set: { status: "REVOKED", revokedAt: now, updatedAt: now } },
    );
    return result.modifiedCount === 1;
  }

  async restoreInvitation(
    weddingId: string,
    guestId: string,
    accessKey: string,
    now: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return false;
    const result = await this.invitations.updateOne(
      {
        weddingId: new ObjectId(weddingId),
        guestId: new ObjectId(guestId),
        status: "REVOKED",
      },
      {
        $set: {
          status: "ACTIVE",
          accessKey,
          revokedAt: null,
          restoredAt: now,
          updatedAt: now,
        },
        $unset: { lastSentAt: "" },
      },
    );
    return result.modifiedCount === 1;
  }

  async updateGuestEmail(
    weddingId: string,
    guestId: string,
    email: string,
    now: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return false;
    const result = await this.guests.updateOne(
      {
        _id: new ObjectId(guestId),
        weddingId: new ObjectId(weddingId),
        status: "ACTIVE",
      },
      {
        $set: {
          "primaryContact.email": email,
          "primaryContact.emailNormalized": email.toLowerCase(),
          updatedAt: now,
        },
      },
    );
    return result.matchedCount === 1;
  }

  async resolveActiveAccess(accessKey: string): Promise<InvitationAccessContext | null> {
    const invitation = await this.invitations.findOne({
      accessKey,
      status: "ACTIVE",
    });
    if (!invitation) return null;
    const [guest, wedding, assignments] = await Promise.all([
      this.guests.findOne({
        _id: invitation.guestId,
        weddingId: invitation.weddingId,
        status: "ACTIVE",
      }),
      this.weddings.findOne({ _id: invitation.weddingId, status: "ACTIVE" }),
      this.eventInvitations
        .find({
          weddingId: invitation.weddingId,
          guestId: invitation.guestId,
          guestInvitationId: invitation._id,
          invitationStatus: "ACTIVE",
        })
        .toArray(),
    ]);
    if (!guest || !wedding) return null;
    const events = assignments.length
      ? await this.events
          .find({
            _id: { $in: assignments.map((item) => item.eventId) },
            weddingId: invitation.weddingId,
            status: "ACTIVE",
          })
          .sort({ startAt: 1, sortOrder: 1, _id: 1 } as never)
          .toArray()
      : [];
    return {
      guestId: guest._id.toHexString(),
      guestName: guest.displayName.en,
      primaryContactName: guest.primaryContact.name.en,
      guestType: guest.guestType,
      coupleName: coupleName(wedding),
      weddingTitle: wedding.title.en,
      weddingDate: wedding.mainWeddingDate,
      weddingTimezone: wedding.timezone,
      weddingCity: wedding.primaryVenue.city.en,
      events: events.map(mapEvent),
    };
  }

  async updateCampaignStatus(
    weddingId: string,
    campaignId: string,
    status: EmailCampaignStatus,
    now: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(campaignId)) return null;
    const document = await this.campaigns.findOneAndUpdate(
      { _id: new ObjectId(campaignId), weddingId: new ObjectId(weddingId) },
      {
        $set: {
          status,
          updatedAt: now,
          ...(["COMPLETED", "FAILED"].includes(status)
            ? { completedAt: now }
            : {}),
        },
      },
      { returnDocument: "after" },
    );
    return document ? this.campaignProgress(document) : null;
  }
}

export async function ensureGuestInvitationIndexes(database: Db) {
  const campaigns = database.collection("emailCampaigns");
  const recipients = database.collection("emailCampaignRecipients");
  await Promise.all([
    campaigns.createIndex(
      { weddingId: 1, status: 1, updatedAt: -1 },
      { name: "idx_email_campaigns_wedding_status" },
    ),
    recipients.createIndex(
      { campaignId: 1, guestId: 1 },
      { name: "uq_email_campaign_recipients_campaign_guest", unique: true },
    ),
    recipients.createIndex(
      { campaignId: 1, status: 1, createdAt: 1 },
      { name: "idx_email_campaign_recipients_campaign_status" },
    ),
    recipients.createIndex(
      { weddingId: 1, guestId: 1 },
      {
        name: "uq_email_campaign_recipients_pending_guest",
        unique: true,
        partialFilterExpression: { status: "PENDING" },
      },
    ),
    recipients.createIndex(
      { weddingId: 1, guestInvitationId: 1, updatedAt: -1 },
      { name: "idx_email_campaign_recipients_invitation" },
    ),
    recipients.createIndex(
      { weddingId: 1, status: 1 },
      { name: "idx_email_campaign_recipients_wedding_status" },
    ),
    recipients.createIndex(
      { weddingId: 1, guestId: 1, updatedAt: -1 },
      { name: "idx_email_campaign_recipients_guest_latest" },
    ),
  ]);
}
