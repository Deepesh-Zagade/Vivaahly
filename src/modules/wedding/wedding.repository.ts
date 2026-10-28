import type {
  LocalizedText,
  Wedding,
  WeddingMembership,
} from "@/modules/wedding/wedding.types";

export class ActiveWeddingMembershipError extends Error {
  constructor() {
    super("This organizer already belongs to an active wedding.");
    this.name = "ActiveWeddingMembershipError";
  }
}

export class DuplicateMediaAccessKeyError extends Error {
  constructor() {
    super("The generated media access key already exists.");
    this.name = "DuplicateMediaAccessKeyError";
  }
}

export type CreateWeddingRecord = {
  userId: string;
  slug: string;
  couple: Wedding["couple"];
  title: LocalizedText;
  mainWeddingDate: Date;
  timezone: string;
  primaryVenue: Wedding["primaryVenue"];
  mediaAccessKey: string;
  createdAt: Date;
};

export type CreatedWeddingWithMembership = {
  wedding: Wedding;
  membership: WeddingMembership;
};

export interface WeddingRepository {
  findActiveMembershipByUserId(userId: string): Promise<WeddingMembership | null>;
  findWeddingById(weddingId: string): Promise<Wedding | null>;
  createWeddingWithAdminMembership(
    input: CreateWeddingRecord,
  ): Promise<CreatedWeddingWithMembership>;
}
