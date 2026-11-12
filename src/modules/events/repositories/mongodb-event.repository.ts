import "server-only";

import {
  ObjectId,
  type Collection,
  type Db,
  type MongoClient,
  type WithId,
} from "mongodb";
import {
  EventLimitReachedError,
  type CreateEventRecord,
  type EventRepository,
  type UpdateEventRecord,
} from "@/modules/events/event.repository";
import type {
  OptionalLocalizedText,
  WeddingEvent,
} from "@/modules/events/event.types";

type EventDocument = {
  weddingId: ObjectId;
  title: { en: string; mr?: string };
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
  status: "ACTIVE" | "DELETED";
  deletedAt: Date | null;
  createdByMembershipId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type WeddingCounterDocument = {
  status: "ACTIVE";
  timezone: string;
  counters: { eventCount: number };
};

function compactLocalized(value: { en?: string; mr?: string }) {
  return {
    ...(value.en ? { en: value.en } : {}),
    ...(value.mr ? { mr: value.mr } : {}),
  };
}

function mapEvent(document: WithId<EventDocument>): WeddingEvent {
  return {
    id: document._id.toHexString(),
    weddingId: document.weddingId.toHexString(),
    title: document.title,
    description: document.description,
    startAt: document.startAt,
    endAt: document.endAt,
    venue: document.venue,
    dressCode: document.dressCode,
    ...(document.privateNotes ? { privateNotes: document.privateNotes } : {}),
    sortOrder: document.sortOrder,
    status: document.status,
    deletedAt: document.deletedAt,
    createdByMembershipId: document.createdByMembershipId.toHexString(),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function eventFields(
  input: CreateEventRecord | UpdateEventRecord,
): Pick<
  EventDocument,
  | "title"
  | "description"
  | "startAt"
  | "endAt"
  | "venue"
  | "dressCode"
  | "privateNotes"
> {
  return {
    title: {
      en: input.title.en,
      ...(input.title.mr ? { mr: input.title.mr } : {}),
    },
    description: compactLocalized(input.description),
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    venue: {
      name: compactLocalized(input.venue.name),
      address: compactLocalized(input.venue.address),
      ...(input.venue.mapUrl ? { mapUrl: input.venue.mapUrl } : {}),
    },
    dressCode: compactLocalized(input.dressCode),
    ...(input.privateNotes ? { privateNotes: input.privateNotes } : {}),
  };
}

export class MongoEventRepository implements EventRepository {
  private readonly events: Collection<EventDocument>;
  private readonly weddings: Collection<WeddingCounterDocument>;

  constructor(
    private readonly client: MongoClient,
    database: Db,
  ) {
    this.events = database.collection<EventDocument>("events");
    this.weddings = database.collection<WeddingCounterDocument>("weddings");
  }

  async findWeddingTimezone(weddingId: string) {
    if (!ObjectId.isValid(weddingId)) return null;
    const wedding = await this.weddings.findOne(
      { _id: new ObjectId(weddingId), status: "ACTIVE" },
      { projection: { timezone: 1 } },
    );
    return wedding?.timezone ?? null;
  }

  async listActiveByWeddingId(weddingId: string) {
    if (!ObjectId.isValid(weddingId)) return [];
    const documents = await this.events
      .find({ weddingId: new ObjectId(weddingId), status: "ACTIVE" })
      .sort({ startAt: 1, sortOrder: 1, _id: 1 })
      .toArray();
    return documents.map(mapEvent);
  }

  async findActiveById(weddingId: string, eventId: string) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(eventId)) return null;
    const event = await this.events.findOne({
      _id: new ObjectId(eventId),
      weddingId: new ObjectId(weddingId),
      status: "ACTIVE",
    });
    return event ? mapEvent(event) : null;
  }

  async createWithCounter(input: CreateEventRecord) {
    const session = this.client.startSession();
    const eventId = new ObjectId();
    const weddingId = new ObjectId(input.weddingId);
    let created: WeddingEvent | null = null;

    try {
      await session.withTransaction(async () => {
        const wedding = await this.weddings.findOneAndUpdate(
          {
            _id: weddingId,
            status: "ACTIVE",
            "counters.eventCount": { $lt: 10 },
          },
          { $inc: { "counters.eventCount": 1 } },
          { returnDocument: "after", session },
        );

        if (!wedding) throw new EventLimitReachedError();

        const document: EventDocument = {
          weddingId,
          ...eventFields(input),
          sortOrder: wedding.counters.eventCount,
          status: "ACTIVE",
          deletedAt: null,
          createdByMembershipId: new ObjectId(input.createdByMembershipId),
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        };
        await this.events.insertOne({ _id: eventId, ...document }, { session });
        created = mapEvent({ _id: eventId, ...document });
      });
    } finally {
      await session.endSession();
    }

    if (!created) throw new Error("Event transaction completed without a result.");
    return created;
  }

  async updateActive(
    weddingId: string,
    eventId: string,
    input: UpdateEventRecord,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(eventId)) return null;
    const event = await this.events.findOneAndUpdate(
      {
        _id: new ObjectId(eventId),
        weddingId: new ObjectId(weddingId),
        status: "ACTIVE",
      },
      {
        $set: {
          ...eventFields(input),
          updatedAt: input.updatedAt,
        },
        ...(!input.privateNotes ? { $unset: { privateNotes: "" } } : {}),
      },
      { returnDocument: "after" },
    );
    return event ? mapEvent(event) : null;
  }

  async softDeleteWithCounter(
    weddingId: string,
    eventId: string,
    deletedAt: Date,
  ) {
    if (!ObjectId.isValid(weddingId) || !ObjectId.isValid(eventId)) return false;
    const session = this.client.startSession();
    let removed = false;

    try {
      await session.withTransaction(async () => {
        const event = await this.events.findOneAndUpdate(
          {
            _id: new ObjectId(eventId),
            weddingId: new ObjectId(weddingId),
            status: "ACTIVE",
          },
          {
            $set: {
              status: "DELETED",
              deletedAt,
              updatedAt: deletedAt,
            },
          },
          { returnDocument: "before", session },
        );
        if (!event) return;

        await this.weddings.updateOne(
          { _id: new ObjectId(weddingId), "counters.eventCount": { $gt: 0 } },
          { $inc: { "counters.eventCount": -1 } },
          { session },
        );
        removed = true;
      });
    } finally {
      await session.endSession();
    }

    return removed;
  }
}

export async function ensureEventIndexes(database: Db) {
  const events = database.collection<EventDocument>("events");
  await Promise.all([
    events.createIndex(
      { weddingId: 1, status: 1, startAt: 1 },
      { name: "idx_events_wedding_status_start" },
    ),
    events.createIndex(
      { weddingId: 1, sortOrder: 1 },
      { name: "idx_events_wedding_sort_order" },
    ),
  ]);
}
