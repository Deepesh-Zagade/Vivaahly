import "server-only";

import {
  ObjectId,
  type Collection,
  type Db,
  type Filter,
  type MongoClient,
  type WithId,
} from "mongodb";
import {
  GuestEventNotFoundError,
  type CreateGuestRecord,
  type GuestRepository,
  type UpdateGuestRecord,
} from "@/modules/guests/guest.repository";
import type {
  GuestListQuery,
  GuestSummary,
  GuestTag,
  GuestType,
  WeddingGuest,
} from "@/modules/guests/guest.types";

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
  organizerNotes?: string;
  status: "ACTIVE" | "REMOVED";
  deletedAt: Date | null;
  createdByMembershipId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type GuestInvitationDocument = {
  weddingId: ObjectId;
  guestId: ObjectId;
  accessKey: string;
  status: "ACTIVE" | "REVOKED";
  lastSentAt?: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type GuestEventInvitationDocument = {
  weddingId: ObjectId;
  guestId: ObjectId;
  guestInvitationId: ObjectId;
  eventId: ObjectId;
  invitationStatus: "ACTIVE" | "REMOVED";
  rsvpStatus: "AWAITING_RESPONSE" | "ATTENDING" | "NOT_ATTENDING";
  attendeeCount: number | null;
  respondedAt?: Date;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventDocument = {
  weddingId: ObjectId;
  status: "ACTIVE" | "DELETED";
};

function mapGuest(document: WithId<GuestDocument>): WeddingGuest {
  return {
    id: document._id.toHexString(),
    weddingId: document.weddingId.toHexString(),
    guestType: document.guestType,
    displayName: document.displayName,
    primaryContact: {
      name: document.primaryContact.name,
      ...(document.primaryContact.email
        ? { email: document.primaryContact.email }
        : {}),
      ...(document.primaryContact.phone
        ? { phone: document.primaryContact.phone }
        : {}),
    },
    tags: document.tags,
    ...(document.organizerNotes
      ? { organizerNotes: document.organizerNotes }
      : {}),
    status: document.status,
    deletedAt: document.deletedAt,
    createdByMembershipId: document.createdByMembershipId.toHexString(),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function guestFields(input: CreateGuestRecord | UpdateGuestRecord) {
  return {
    guestType: input.guestType,
    displayName: {
      en: input.displayName.en,
      ...(input.displayName.mr ? { mr: input.displayName.mr } : {}),
    },
    primaryContact: {
      name: {
        en: input.primaryContact.name.en,
        ...(input.primaryContact.name.mr
          ? { mr: input.primaryContact.name.mr }
          : {}),
      },
      ...(input.primaryContact.email
        ? {
            email: input.primaryContact.email,
            emailNormalized: input.primaryContact.email.toLowerCase(),
          }
        : {}),
      ...(input.primaryContact.phone
        ? { phone: input.primaryContact.phone }
        : {}),
    },
    tags: input.tags,
    ...(input.organizerNotes
      ? { organizerNotes: input.organizerNotes }
      : {}),
  };
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

const emptySummary: GuestSummary = {
  total: 0,
  individual: 0,
  family: 0,
  brideSide: 0,
  groomSide: 0,
};

export class MongoGuestRepository implements GuestRepository {
  private readonly guests: Collection<GuestDocument>;
  private readonly invitations: Collection<GuestInvitationDocument>;
  private readonly eventInvitations: Collection<GuestEventInvitationDocument>;
  private readonly events: Collection<EventDocument>;

  constructor(
    private readonly client: MongoClient,
    database: Db,
  ) {
    this.guests = database.collection<GuestDocument>("guests");
    this.invitations =
      database.collection<GuestInvitationDocument>("guestInvitations");
    this.eventInvitations =
      database.collection<GuestEventInvitationDocument>(
        "guestEventInvitations",
      );
    this.events = database.collection<EventDocument>("events");
  }

  async listActive(weddingId: string, query: GuestListQuery) {
    if (!ObjectId.isValid(weddingId)) {
      return {
        guests: [],
        eventIdsByGuest: {},
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: 0,
        summary: emptySummary,
      };
    }

    const weddingObjectId = new ObjectId(weddingId);
    const filter: Filter<GuestDocument> = {
      weddingId: weddingObjectId,
      status: "ACTIVE",
    };
    if (query.guestType) filter.guestType = query.guestType;
    if (query.tag) filter.tags = query.tag;
    if (query.q) {
      const expression = new RegExp(escapeRegularExpression(query.q), "iu");
      filter.$or = [
        { "displayName.en": expression },
        { "displayName.mr": expression },
        { "primaryContact.name.en": expression },
        { "primaryContact.name.mr": expression },
      ];
    }
    if (query.eventId) {
      if (!ObjectId.isValid(query.eventId)) {
        return {
          guests: [],
          eventIdsByGuest: {},
          total: 0,
          page: query.page,
          pageSize: query.pageSize,
          pageCount: 0,
          summary: await this.getSummary(weddingId),
        };
      }
      const guestIds = await this.eventInvitations.distinct("guestId", {
        weddingId: weddingObjectId,
        eventId: new ObjectId(query.eventId),
        invitationStatus: "ACTIVE",
      });
      filter._id = { $in: guestIds };
    }

    const [total, summary] = await Promise.all([
      this.guests.countDocuments(filter),
      this.getSummary(weddingId),
    ]);
    const pageCount = total === 0 ? 0 : Math.ceil(total / query.pageSize);
    const page = pageCount ? Math.min(query.page, pageCount) : query.page;
    const documents = await this.guests
      .find(filter)
      .sort({ "displayName.en": 1, _id: 1 })
      .skip((page - 1) * query.pageSize)
      .limit(query.pageSize)
      .toArray();
    const assignments = documents.length
      ? await this.eventInvitations
          .find({
            weddingId: weddingObjectId,
            guestId: { $in: documents.map((document) => document._id) },
            invitationStatus: "ACTIVE",
          })
          .sort({ createdAt: 1, _id: 1 })
          .toArray()
      : [];
    const eventIdsByGuest: Record<string, string[]> = {};
    for (const assignment of assignments) {
      const guestKey = assignment.guestId.toHexString();
      eventIdsByGuest[guestKey] = [
        ...(eventIdsByGuest[guestKey] ?? []),
        assignment.eventId.toHexString(),
      ];
    }

    return {
      guests: documents.map(mapGuest),
      eventIdsByGuest,
      total,
      page,
      pageSize: query.pageSize,
      pageCount,
      summary,
    };
  }

  async getSummary(weddingId: string) {
    if (!ObjectId.isValid(weddingId)) return emptySummary;
    const base = { weddingId: new ObjectId(weddingId), status: "ACTIVE" as const };
    const [total, individual, family, brideSide, groomSide] = await Promise.all([
      this.guests.countDocuments(base),
      this.guests.countDocuments({ ...base, guestType: "INDIVIDUAL" }),
      this.guests.countDocuments({ ...base, guestType: "FAMILY" }),
      this.guests.countDocuments({ ...base, tags: "BRIDE_SIDE" }),
      this.guests.countDocuments({ ...base, tags: "GROOM_SIDE" }),
    ]);
    return { total, individual, family, brideSide, groomSide };
  }

  async findActiveById(weddingId: string, guestId: string) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return null;
    const weddingObjectId = new ObjectId(weddingId);
    const guestObjectId = new ObjectId(guestId);
    const [guest, assignments] = await Promise.all([
      this.guests.findOne({
        _id: guestObjectId,
        weddingId: weddingObjectId,
        status: "ACTIVE",
      }),
      this.eventInvitations
        .find({
          weddingId: weddingObjectId,
          guestId: guestObjectId,
          invitationStatus: "ACTIVE",
        })
        .sort({ createdAt: 1, _id: 1 })
        .toArray(),
    ]);
    if (!guest) return null;
    const assignedEventIds = assignments.map((assignment) => assignment.eventId);
    const activeEvents = assignedEventIds.length
      ? await this.events
          .find(
            {
              _id: { $in: assignedEventIds },
              weddingId: weddingObjectId,
              status: "ACTIVE",
            },
            { projection: { _id: 1 } },
          )
          .toArray()
      : [];
    const activeEventIds = new Set(
      activeEvents.map((event) => event._id.toHexString()),
    );
    return {
      guest: mapGuest(guest),
      eventIds: assignments
        .map((assignment) => assignment.eventId.toHexString())
        .filter((eventId) => activeEventIds.has(eventId)),
    };
  }

  async createWithInvitation(input: CreateGuestRecord) {
    const session = this.client.startSession();
    const guestId = new ObjectId();
    const invitationId = new ObjectId();
    const weddingId = new ObjectId(input.weddingId);
    const document: GuestDocument = {
      weddingId,
      ...guestFields(input),
      status: "ACTIVE",
      deletedAt: null,
      createdByMembershipId: new ObjectId(input.createdByMembershipId),
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };

    try {
      await session.withTransaction(async () => {
        await this.guests.insertOne(
          { _id: guestId, ...document },
          { session },
        );
        await this.invitations.insertOne(
          {
            _id: invitationId,
            weddingId,
            guestId,
            accessKey: input.accessKey,
            status: "ACTIVE",
            revokedAt: null,
            createdAt: input.createdAt,
            updatedAt: input.createdAt,
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return mapGuest({ _id: guestId, ...document });
  }

  async updateActive(
    weddingId: string,
    guestId: string,
    input: UpdateGuestRecord,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return null;
    const guest = await this.guests.findOneAndUpdate(
      {
        _id: new ObjectId(guestId),
        weddingId: new ObjectId(weddingId),
        status: "ACTIVE",
      },
      {
        $set: { ...guestFields(input), updatedAt: input.updatedAt },
        ...(!input.organizerNotes
          ? { $unset: { organizerNotes: "" } }
          : {}),
      },
      { returnDocument: "after" },
    );
    return guest ? mapGuest(guest) : null;
  }

  async replaceEventAssignments(
    weddingId: string,
    guestId: string,
    eventIds: string[],
    updatedAt: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return false;
    const session = this.client.startSession();
    const weddingObjectId = new ObjectId(weddingId);
    const guestObjectId = new ObjectId(guestId);
    const desiredIds = eventIds.map((id) => new ObjectId(id));
    let updated = false;

    try {
      await session.withTransaction(async () => {
        const guest = await this.guests.findOne(
          { _id: guestObjectId, weddingId: weddingObjectId, status: "ACTIVE" },
          { session, projection: { _id: 1 } },
        );
        const invitation = await this.invitations.findOne(
          { weddingId: weddingObjectId, guestId: guestObjectId, status: "ACTIVE" },
          { session, projection: { _id: 1 } },
        );
        const validEventCount = desiredIds.length
          ? await this.events.countDocuments(
              { _id: { $in: desiredIds }, weddingId: weddingObjectId, status: "ACTIVE" },
              { session },
            )
          : 0;
        const current = await this.eventInvitations
          .find(
            { weddingId: weddingObjectId, guestId: guestObjectId },
            { session },
          )
          .toArray();
        const currentEventIds = current.map((record) => record.eventId);
        const editableEvents = currentEventIds.length
          ? await this.events
              .find(
                {
                  _id: { $in: currentEventIds },
                  weddingId: weddingObjectId,
                  status: "ACTIVE",
                },
                { session, projection: { _id: 1 } },
              )
              .toArray()
          : [];

        if (!guest || !invitation) return;
        if (validEventCount !== desiredIds.length) {
          throw new GuestEventNotFoundError();
        }

        const desired = new Set(desiredIds.map((id) => id.toHexString()));
        const editableEventIds = new Set(
          editableEvents.map((event) => event._id.toHexString()),
        );
        const currentByEvent = new Map(
          current.map((record) => [record.eventId.toHexString(), record]),
        );

        const removals = current
          .filter(
            (record) =>
              record.invitationStatus === "ACTIVE" &&
              editableEventIds.has(record.eventId.toHexString()) &&
              !desired.has(record.eventId.toHexString()),
          )
          .map((record) => record._id);
        if (removals.length) {
          await this.eventInvitations.updateMany(
            { _id: { $in: removals } },
            {
              $set: {
                invitationStatus: "REMOVED",
                removedAt: updatedAt,
                updatedAt,
              },
            },
            { session },
          );
        }

        for (const eventId of desiredIds) {
          const existing = currentByEvent.get(eventId.toHexString());
          if (existing?.invitationStatus === "ACTIVE") continue;
          if (existing) {
            await this.eventInvitations.updateOne(
              { _id: existing._id },
              {
                $set: {
                  invitationStatus: "ACTIVE",
                  rsvpStatus: "AWAITING_RESPONSE",
                  attendeeCount: null,
                  removedAt: null,
                  updatedAt,
                },
                $unset: { respondedAt: "" },
              },
              { session },
            );
          } else {
            await this.eventInvitations.insertOne(
              {
                weddingId: weddingObjectId,
                guestId: guestObjectId,
                guestInvitationId: invitation._id,
                eventId,
                invitationStatus: "ACTIVE",
                rsvpStatus: "AWAITING_RESPONSE",
                attendeeCount: null,
                removedAt: null,
                createdAt: updatedAt,
                updatedAt,
              },
              { session },
            );
          }
        }
        updated = true;
      });
    } finally {
      await session.endSession();
    }
    return updated;
  }

  async softRemoveWithAccess(
    weddingId: string,
    guestId: string,
    removedAt: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(guestId)) return false;
    const session = this.client.startSession();
    const weddingObjectId = new ObjectId(weddingId);
    const guestObjectId = new ObjectId(guestId);
    let removed = false;

    try {
      await session.withTransaction(async () => {
        const guest = await this.guests.findOneAndUpdate(
          { _id: guestObjectId, weddingId: weddingObjectId, status: "ACTIVE" },
          {
            $set: {
              status: "REMOVED",
              deletedAt: removedAt,
              updatedAt: removedAt,
            },
          },
          { returnDocument: "before", session },
        );
        if (!guest) return;

        await this.invitations.updateMany(
            { weddingId: weddingObjectId, guestId: guestObjectId, status: "ACTIVE" },
            {
              $set: {
                status: "REVOKED",
                revokedAt: removedAt,
                updatedAt: removedAt,
              },
            },
            { session },
          );
        await this.eventInvitations.updateMany(
            {
              weddingId: weddingObjectId,
              guestId: guestObjectId,
              invitationStatus: "ACTIVE",
            },
            {
              $set: {
                invitationStatus: "REMOVED",
                removedAt,
                updatedAt: removedAt,
              },
            },
            { session },
          );
        removed = true;
      });
    } finally {
      await session.endSession();
    }
    return removed;
  }

  async countActiveAssignmentsByEvent(
    weddingId: string,
    eventIds: string[],
  ) {
    if (!ObjectId.isValid(weddingId) || eventIds.length === 0) return {};
    const validIds = eventIds.filter((id) => ObjectId.isValid(id));
    if (!validIds.length) return {};
    const rows = await this.eventInvitations
      .aggregate<{ _id: ObjectId; count: number }>([
        {
          $match: {
            weddingId: new ObjectId(weddingId),
            eventId: { $in: validIds.map((id) => new ObjectId(id)) },
            invitationStatus: "ACTIVE",
          },
        },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
      ])
      .toArray();
    return Object.fromEntries(
      rows.map((row) => [row._id.toHexString(), row.count]),
    );
  }
}

export async function ensureGuestIndexes(database: Db) {
  const guests = database.collection<GuestDocument>("guests");
  const invitations =
    database.collection<GuestInvitationDocument>("guestInvitations");
  const eventInvitations =
    database.collection<GuestEventInvitationDocument>("guestEventInvitations");

  await Promise.all([
    guests.createIndex(
      { weddingId: 1, status: 1 },
      { name: "idx_guests_wedding_status" },
    ),
    guests.createIndex(
      { weddingId: 1, "primaryContact.emailNormalized": 1 },
      { name: "idx_guests_wedding_email" },
    ),
    guests.createIndex(
      { weddingId: 1, tags: 1 },
      { name: "idx_guests_wedding_tags" },
    ),
    guests.createIndex(
      { weddingId: 1, "displayName.en": 1 },
      { name: "idx_guests_wedding_display_name" },
    ),
    invitations.createIndex(
      { accessKey: 1 },
      { name: "uq_guest_invitations_access_key", unique: true },
    ),
    invitations.createIndex(
      { weddingId: 1, guestId: 1 },
      { name: "uq_guest_invitations_wedding_guest", unique: true },
    ),
    invitations.createIndex(
      { weddingId: 1, status: 1 },
      { name: "idx_guest_invitations_wedding_status" },
    ),
    eventInvitations.createIndex(
      { weddingId: 1, guestId: 1, eventId: 1 },
      { name: "uq_guest_event_invitations_relationship", unique: true },
    ),
    eventInvitations.createIndex(
      { weddingId: 1, eventId: 1, invitationStatus: 1 },
      { name: "idx_guest_event_invitations_event" },
    ),
    eventInvitations.createIndex(
      { weddingId: 1, guestId: 1, invitationStatus: 1 },
      { name: "idx_guest_event_invitations_guest" },
    ),
  ]);
}
