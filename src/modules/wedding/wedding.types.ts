export type LocalizedText = {
  en: string;
  mr?: string;
};

export type WeddingMemberRole = "ADMIN" | "MANAGER";
export type WeddingMemberStatus = "ACTIVE" | "REMOVED";

export type WeddingMembership = {
  id: string;
  weddingId: string;
  userId: string;
  role: WeddingMemberRole;
  status: WeddingMemberStatus;
  joinedAt: Date;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizerMembershipContext = Pick<
  WeddingMembership,
  "id" | "weddingId" | "role"
>;

export type Wedding = {
  id: string;
  slug: string;
  status: "ACTIVE";
  couple: {
    bride: { name: LocalizedText };
    groom: { name: LocalizedText };
  };
  title: LocalizedText;
  mainWeddingDate: Date;
  timezone: string;
  primaryVenue: {
    city: LocalizedText;
  };
  website: {
    themeId: "THEME_01";
    defaultLocale: "en";
    supportedLocales: Array<"en" | "mr">;
    livestream: {
      enabled: false;
      youtubeUrl: null;
    };
  };
  mediaAccessKey: string;
  counters: {
    eventCount: number;
  };
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WeddingDto = {
  id: string;
  slug: string;
  couple: Wedding["couple"];
  title: LocalizedText;
  mainWeddingDate: string;
  timezone: string;
  primaryVenue: Wedding["primaryVenue"];
  website: Wedding["website"];
};

export type WeddingMembershipDto = OrganizerMembershipContext;

export function mapWeddingDto(wedding: Wedding): WeddingDto {
  return {
    id: wedding.id,
    slug: wedding.slug,
    couple: wedding.couple,
    title: wedding.title,
    mainWeddingDate: wedding.mainWeddingDate.toISOString().slice(0, 10),
    timezone: wedding.timezone,
    primaryVenue: wedding.primaryVenue,
    website: wedding.website,
  };
}

export function mapMembershipContext(
  membership: WeddingMembership,
): OrganizerMembershipContext {
  return {
    id: membership.id,
    weddingId: membership.weddingId,
    role: membership.role,
  };
}
