import "server-only";

import type { ObjectId } from "mongodb";
import { guestInputSchema } from "@/modules/guests/guest.schemas";
import { getGuestService } from "@/modules/guests/guest.server";
import type { GuestTag } from "@/modules/guests/guest.types";
import type { OrganizerMembershipContext } from "@/modules/wedding/wedding.types";
import { getMongoEnvironment } from "@/server/config/env.server";
import {
  getMongoClient,
  getMongoDatabase,
} from "@/server/providers/mongodb/client";

const SEED_MARKER = "[PAGINATION_TEST_GUEST_V1]";
const SEED_MARKER_PATTERN = "^\\[PAGINATION_TEST_GUEST_V1\\]";
const TARGET_COUNT = 95;

type SessionDocument = {
  userId: ObjectId;
  lastSeenAt: Date;
};

type MembershipDocument = {
  weddingId: ObjectId;
  userId: ObjectId;
  role: "ADMIN" | "MANAGER";
  status: "ACTIVE" | "REMOVED";
  updatedAt: Date;
};

async function seedGuestPaginationData() {
  const environment = getMongoEnvironment();
  if (environment.MONGODB_DB_NAME !== "vivaahly_dev") {
    throw new Error(
      `Refusing to seed non-development database: ${environment.MONGODB_DB_NAME}`,
    );
  }

  const database = await getMongoDatabase();
  const session = await database
    .collection<SessionDocument>("sessions")
    .find({})
    .sort({ lastSeenAt: -1 })
    .limit(1)
    .next();
  if (!session) throw new Error("No local development session was found.");

  const membership = await database
    .collection<MembershipDocument>("weddingMembers")
    .find({ userId: session.userId, status: "ACTIVE" })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next();
  if (!membership) {
    throw new Error("The latest local user has no active wedding membership.");
  }

  const membershipContext: OrganizerMembershipContext = {
    id: membership._id.toHexString(),
    weddingId: membership.weddingId.toHexString(),
    role: membership.role,
  };
  const existingSeedCount = await database.collection("guests").countDocuments({
    weddingId: membership.weddingId,
    status: "ACTIVE",
    organizerNotes: { $regex: SEED_MARKER_PATTERN },
  });
  const numberToCreate = Math.max(0, TARGET_COUNT - existingSeedCount);
  if (!numberToCreate) {
    console.log(`Guest pagination seed already contains ${TARGET_COUNT} records.`);
    return;
  }

  const events = await database
    .collection<{ weddingId: ObjectId; status: "ACTIVE" | "DELETED" }>("events")
    .find({ weddingId: membership.weddingId, status: "ACTIVE" })
    .sort({ startAt: 1, _id: 1 })
    .project<{ _id: ObjectId }>({ _id: 1 })
    .toArray();
  const eventIds = events.map((event) => event._id.toHexString());
  const guestService = await getGuestService();

  for (let offset = 0; offset < numberToCreate; offset += 1) {
    const number = existingSeedCount + offset + 1;
    const guestType = number % 4 === 0 ? "FAMILY" : "INDIVIDUAL";
    const displayName =
      guestType === "FAMILY"
        ? `Pagination Test Family ${String(number).padStart(2, "0")}`
        : `Pagination Test Guest ${String(number).padStart(2, "0")}`;
    const primaryName =
      guestType === "FAMILY"
        ? `Pagination Primary Contact ${String(number).padStart(2, "0")}`
        : displayName;
    const input = guestInputSchema.parse({
      guestType,
      displayName: { en: displayName },
      primaryContact: {
        name: { en: primaryName },
        email: `pagination.test.${String(number).padStart(2, "0")}@example.com`,
        phone: `+91 91000 ${String(number).padStart(5, "0")}`,
      },
      tags: tagsFor(number),
      organizerNotes: `${SEED_MARKER} Local pagination and filter test record ${number}.`,
    });
    const guest = await guestService.createGuest(membershipContext, input);

    if (eventIds.length && number % 5 !== 0) {
      const assignmentCount = 1 + (number % Math.min(3, eventIds.length));
      const startIndex = number % eventIds.length;
      const assignedEventIds = Array.from(
        { length: assignmentCount },
        (_, index) => eventIds[(startIndex + index) % eventIds.length],
      );
      await guestService.assignEvents(membershipContext, guest.id, {
        eventIds: [...new Set(assignedEventIds)],
      });
    }
  }

  const activeGuestCount = await database.collection("guests").countDocuments({
    weddingId: membership.weddingId,
    status: "ACTIVE",
  });
  console.log(
    `Created ${numberToCreate} pagination test guests. Active guest total: ${activeGuestCount}.`,
  );
}

function tagsFor(number: number): GuestTag[] {
  const choices: GuestTag[][] = [
    ["BRIDE_SIDE", "FRIENDS"],
    ["GROOM_SIDE", "RELATIVES"],
    ["COLLEAGUES"],
    ["BRIDE_SIDE", "VIP"],
    ["GROOM_SIDE", "FRIENDS"],
    ["RELATIVES", "VIP"],
  ];
  return choices[(number - 1) % choices.length] ?? ["FRIENDS"];
}

async function main() {
  try {
    await seedGuestPaginationData();
  } finally {
    await (await getMongoClient()).close();
  }
}

main().catch((error: unknown) => {
  console.error("Unable to seed guest pagination data.", error);
  process.exitCode = 1;
});
