import "server-only";

import { randomBytes } from "node:crypto";
import type { CreateWeddingInput } from "@/modules/wedding/wedding.schemas";
import {
  ActiveWeddingMembershipError,
  DuplicateMediaAccessKeyError,
  type WeddingRepository,
} from "@/modules/wedding/wedding.repository";
import {
  mapMembershipContext,
  type OrganizerMembershipContext,
} from "@/modules/wedding/wedding.types";
import {
  conflictError,
  notFoundError,
  validationError,
} from "@/server/http/errors";

type WeddingServiceDependencies = {
  repository: WeddingRepository;
  now?: () => Date;
  createMediaAccessKey?: () => string;
};

function dateStamp(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}${month}${year}`;
}

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateWeddingSlug(input: CreateWeddingInput) {
  const groom = slugPart(input.couple.groom.name.en);
  const bride = slugPart(input.couple.bride.name.en);
  const names = [groom, bride].filter(Boolean).join("-and-") || "wedding";
  return `${names}-${dateStamp(input.mainWeddingDate)}`;
}

function todayInTimezone(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function defaultMediaAccessKey() {
  return randomBytes(32).toString("base64url");
}

export class WeddingService {
  private readonly repository: WeddingRepository;
  private readonly now: () => Date;
  private readonly createMediaAccessKey: () => string;

  constructor({
    repository,
    now = () => new Date(),
    createMediaAccessKey = defaultMediaAccessKey,
  }: WeddingServiceDependencies) {
    this.repository = repository;
    this.now = now;
    this.createMediaAccessKey = createMediaAccessKey;
  }

  async findActiveMembershipForUser(
    userId: string,
  ): Promise<OrganizerMembershipContext | null> {
    const membership = await this.repository.findActiveMembershipByUserId(userId);
    return membership ? mapMembershipContext(membership) : null;
  }

  async createWedding(userId: string, input: CreateWeddingInput) {
    const createdAt = this.now();

    if (input.mainWeddingDate < todayInTimezone(createdAt, input.timezone)) {
      throw validationError("The wedding date cannot be in the past.", {
        fieldErrors: {
          mainWeddingDate: ["Choose today or a future wedding date."],
        },
      });
    }

    const title = {
      en: input.title.en,
      ...(input.title.mr
        ? { mr: input.title.mr }
        : input.couple.groom.name.mr && input.couple.bride.name.mr
          ? {
              mr: `${input.couple.groom.name.mr} आणि ${input.couple.bride.name.mr}`,
            }
          : {}),
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.repository.createWeddingWithAdminMembership({
          userId,
          slug: generateWeddingSlug(input),
          couple: input.couple,
          title,
          mainWeddingDate: new Date(`${input.mainWeddingDate}T00:00:00.000Z`),
          timezone: input.timezone,
          primaryVenue: input.primaryVenue,
          mediaAccessKey: this.createMediaAccessKey(),
          createdAt,
        });
      } catch (error) {
        if (error instanceof ActiveWeddingMembershipError) {
          throw conflictError("Your account already belongs to a wedding.");
        }

        if (error instanceof DuplicateMediaAccessKeyError && attempt === 0) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Unable to generate a unique media access key.");
  }

  async getWeddingForOrganizer(membership: OrganizerMembershipContext) {
    const wedding = await this.repository.findWeddingById(membership.weddingId);

    if (!wedding || wedding.status !== "ACTIVE") {
      throw notFoundError("Wedding not found.");
    }

    return wedding;
  }
}
