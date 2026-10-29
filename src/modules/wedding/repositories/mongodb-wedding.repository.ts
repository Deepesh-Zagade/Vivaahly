import "server-only";

import {
  MongoServerError,
  ObjectId,
  type Collection,
  type Db,
  type MongoClient,
  type WithId,
} from "mongodb";
import {
  ActiveWeddingMembershipError,
  DuplicateMediaAccessKeyError,
  type CreateWeddingRecord,
  type UpdateWeddingDetailsRecord,
  type WeddingRepository,
} from "@/modules/wedding/wedding.repository";
import type {
  Wedding,
  WeddingMembership,
} from "@/modules/wedding/wedding.types";

type WeddingDocument = {
  slug: string;
  status: "ACTIVE";
  couple: Wedding["couple"];
  title: Wedding["title"];
  mainWeddingDate: Date;
  timezone: string;
  primaryVenue: Wedding["primaryVenue"];
  website: Wedding["website"];
  mediaAccessKey: string;
  counters: { eventCount: number };
  createdByUserId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type WeddingMemberDocument = {
  weddingId: ObjectId;
  userId: ObjectId;
  role: "ADMIN" | "MANAGER";
  status: "ACTIVE" | "REMOVED";
  joinedAt: Date;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapWedding(document: WithId<WeddingDocument>): Wedding {
  return {
    id: document._id.toHexString(),
    slug: document.slug,
    status: document.status,
    couple: document.couple,
    title: document.title,
    mainWeddingDate: document.mainWeddingDate,
    timezone: document.timezone,
    primaryVenue: document.primaryVenue,
    website: document.website,
    mediaAccessKey: document.mediaAccessKey,
    counters: document.counters,
    createdByUserId: document.createdByUserId.toHexString(),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function mapMembership(
  document: WithId<WeddingMemberDocument>,
): WeddingMembership {
  return {
    id: document._id.toHexString(),
    weddingId: document.weddingId.toHexString(),
    userId: document.userId.toHexString(),
    role: document.role,
    status: document.status,
    joinedAt: document.joinedAt,
    removedAt: document.removedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function isDuplicateKey(error: unknown, key: string) {
  if (!(error instanceof MongoServerError) || error.code !== 11_000) return false;
  const keyPattern = error.keyPattern as Record<string, number> | undefined;
  return Boolean(keyPattern?.[key]);
}

export function weddingDetailsSetFields(input: UpdateWeddingDetailsRecord) {
  return {
    couple: input.couple,
    "title.en": input.titleEn,
    mainWeddingDate: input.mainWeddingDate,
    timezone: input.timezone,
    "primaryVenue.city.en": input.primaryVenueCityEn,
    updatedAt: input.updatedAt,
  };
}

export class MongoWeddingRepository implements WeddingRepository {
  private readonly weddings: Collection<WeddingDocument>;
  private readonly members: Collection<WeddingMemberDocument>;

  constructor(
    private readonly client: MongoClient,
    database: Db,
  ) {
    this.weddings = database.collection<WeddingDocument>("weddings");
    this.members = database.collection<WeddingMemberDocument>("weddingMembers");
  }

  async findActiveMembershipByUserId(userId: string) {
    if (!ObjectId.isValid(userId)) return null;

    const membership = await this.members.findOne({
      userId: new ObjectId(userId),
      status: "ACTIVE",
    });

    return membership ? mapMembership(membership) : null;
  }

  async findWeddingById(weddingId: string) {
    if (!ObjectId.isValid(weddingId)) return null;

    const wedding = await this.weddings.findOne({ _id: new ObjectId(weddingId) });
    return wedding ? mapWedding(wedding) : null;
  }

  async createWeddingWithAdminMembership(input: CreateWeddingRecord) {
    const session = this.client.startSession();
    const weddingId = new ObjectId();
    const membershipId = new ObjectId();
    const userId = new ObjectId(input.userId);
    const weddingDocument: WeddingDocument = {
      slug: input.slug,
      status: "ACTIVE",
      couple: input.couple,
      title: input.title,
      mainWeddingDate: input.mainWeddingDate,
      timezone: input.timezone,
      primaryVenue: input.primaryVenue,
      website: {
        themeId: "THEME_01",
        defaultLocale: "en",
        supportedLocales: ["en", "mr"],
        livestream: { enabled: false, youtubeUrl: null },
      },
      mediaAccessKey: input.mediaAccessKey,
      counters: { eventCount: 0 },
      createdByUserId: userId,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };
    const membershipDocument: WeddingMemberDocument = {
      weddingId,
      userId,
      role: "ADMIN",
      status: "ACTIVE",
      joinedAt: input.createdAt,
      removedAt: null,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    };

    try {
      await session.withTransaction(async () => {
        const existingMembership = await this.members.findOne(
          { userId, status: "ACTIVE" },
          { session, projection: { _id: 1 } },
        );

        if (existingMembership) throw new ActiveWeddingMembershipError();

        await this.weddings.insertOne(
          { _id: weddingId, ...weddingDocument },
          { session },
        );
        await this.members.insertOne(
          { _id: membershipId, ...membershipDocument },
          { session },
        );
      });

      return {
        wedding: mapWedding({ _id: weddingId, ...weddingDocument }),
        membership: mapMembership({ _id: membershipId, ...membershipDocument }),
      };
    } catch (error) {
      if (error instanceof ActiveWeddingMembershipError) throw error;
      if (isDuplicateKey(error, "userId")) {
        throw new ActiveWeddingMembershipError();
      }
      if (isDuplicateKey(error, "mediaAccessKey")) {
        throw new DuplicateMediaAccessKeyError();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateWeddingDetails(
    weddingId: string,
    input: UpdateWeddingDetailsRecord,
  ) {
    if (!ObjectId.isValid(weddingId)) return null;

    const wedding = await this.weddings.findOneAndUpdate(
      { _id: new ObjectId(weddingId), status: "ACTIVE" },
      {
        $set: weddingDetailsSetFields(input),
      },
      { returnDocument: "after" },
    );

    return wedding ? mapWedding(wedding) : null;
  }
}

export async function ensureWeddingIndexes(database: Db) {
  const weddings = database.collection<WeddingDocument>("weddings");
  const members = database.collection<WeddingMemberDocument>("weddingMembers");

  await Promise.all([
    weddings.createIndex({ slug: 1 }, { name: "idx_weddings_slug" }),
    weddings.createIndex(
      { mediaAccessKey: 1 },
      { unique: true, name: "uniq_weddings_media_access_key" },
    ),
    weddings.createIndex({ status: 1 }, { name: "idx_weddings_status" }),
    members.createIndex(
      { weddingId: 1, userId: 1 },
      { unique: true, name: "uniq_wedding_members_wedding_user" },
    ),
    members.createIndex(
      { weddingId: 1, status: 1 },
      { name: "idx_wedding_members_wedding_status" },
    ),
    members.createIndex(
      { weddingId: 1, role: 1, status: 1 },
      { name: "idx_wedding_members_wedding_role_status" },
    ),
    members.createIndex(
      { userId: 1 },
      {
        unique: true,
        name: "uniq_wedding_members_active_user",
        partialFilterExpression: { status: "ACTIVE" },
      },
    ),
  ]);
}
