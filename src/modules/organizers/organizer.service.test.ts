import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedOrganizer, OrganizerUser } from "@/modules/auth/auth.types";
import {
  OrganizerInvitationActiveMembershipError,
  PendingOrganizerInvitationError,
  type OrganizerInvitationMailer,
  type OrganizerRepository,
} from "@/modules/organizers/organizer.repository";
import { OrganizerService } from "@/modules/organizers/organizer.service";
import type {
  OrganizerInvitation,
  OrganizerInvitationAccessRecord,
} from "@/modules/organizers/organizer.types";
import type { Wedding, WeddingMembership } from "@/modules/wedding/wedding.types";
import { ApplicationError } from "@/server/http/errors";

const now = new Date("2026-10-29T10:00:00.000Z");
const user: OrganizerUser = {
  id: "690092d1b617241033eaa111",
  name: "Deepesh Patil",
  email: "deepesh@example.com",
  emailNormalized: "deepesh@example.com",
  passwordHash: "hash",
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
};
const membership = {
  id: "690092d1b617241033eaa222",
  weddingId: "690092d1b617241033eaa333",
  role: "ADMIN" as const,
};
const organizer: AuthenticatedOrganizer = { user, membership };
const wedding: Wedding = {
  id: membership.weddingId,
  slug: "deepesh-and-priya-14022027",
  status: "ACTIVE",
  couple: {
    groom: { name: { en: "Deepesh" } },
    bride: { name: { en: "Priya" } },
  },
  title: { en: "Our Forever Begins" },
  mainWeddingDate: new Date("2027-02-14T00:00:00.000Z"),
  timezone: "Asia/Kolkata",
  primaryVenue: { city: { en: "Pune, Maharashtra" } },
  website: {
    themeId: "THEME_01",
    defaultLocale: "en",
    supportedLocales: ["en", "mr"],
    livestream: { enabled: false, youtubeUrl: null },
  },
  mediaAccessKey: "secret",
  counters: { eventCount: 0 },
  createdByUserId: user.id,
  createdAt: now,
  updatedAt: now,
};
const invitation: OrganizerInvitation = {
  id: "690092d1b617241033eaa444",
  weddingId: wedding.id,
  email: "rahul@example.com",
  emailNormalized: "rahul@example.com",
  role: "MANAGER",
  tokenHash: "stored-hash",
  status: "PENDING",
  invitedByMembershipId: membership.id,
  expiresAt: new Date("2026-11-05T10:00:00.000Z"),
  acceptedAt: null,
  acceptedByUserId: null,
  createdAt: now,
  updatedAt: now,
};
const invitedUser: OrganizerUser = {
  ...user,
  id: "690092d1b617241033eaa555",
  name: "Rahul Sharma",
  email: invitation.email,
  emailNormalized: invitation.emailNormalized,
};

function accessRecord(existingUser: OrganizerUser | null = null): OrganizerInvitationAccessRecord {
  return {
    invitation,
    wedding,
    inviter: { id: user.id, name: user.name },
    invitedUser: existingUser,
  };
}

function makeDependencies() {
  const repository: OrganizerRepository = {
    findWeddingById: vi.fn().mockResolvedValue(wedding),
    listActiveMembers: vi.fn().mockResolvedValue([]),
    listPendingInvitations: vi.fn().mockResolvedValue([]),
    findActiveMemberByEmail: vi.fn().mockResolvedValue(null),
    findActiveMembershipByUserId: vi.fn().mockResolvedValue(null),
    findInvitationByIdForWedding: vi.fn().mockResolvedValue(invitation),
    findInvitationAccessByTokenHash: vi.fn().mockResolvedValue(accessRecord()),
    expirePendingInvitationForEmail: vi.fn().mockResolvedValue(undefined),
    createInvitation: vi.fn().mockImplementation(async (record) => ({
      ...invitation,
      tokenHash: record.tokenHash,
      email: record.email,
      emailNormalized: record.emailNormalized,
      role: record.role,
      expiresAt: record.expiresAt,
    })),
    revokeInvitation: vi.fn().mockResolvedValue(true),
    rotateInvitation: vi.fn().mockResolvedValue(invitation),
    acceptInvitation: vi.fn().mockResolvedValue({
      invitation: { ...invitation, status: "ACCEPTED", expiresAt: null },
      membership: {
        id: "690092d1b617241033eaa666",
        weddingId: wedding.id,
        userId: invitedUser.id,
        role: "MANAGER",
        status: "ACTIVE",
        joinedAt: now,
        removedAt: null,
        createdAt: now,
        updatedAt: now,
      } satisfies WeddingMembership,
      user: invitedUser,
    }),
  };
  const mailer: OrganizerInvitationMailer = {
    sendInvitation: vi.fn().mockResolvedValue(undefined),
  };
  return { repository, mailer };
}

function makeService(repository: OrganizerRepository, mailer: OrganizerInvitationMailer) {
  return new OrganizerService({
    repository,
    mailer,
    appBaseUrl: "https://vivaahly.example",
    now: () => now,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("OrganizerService", () => {
  it("creates a seven-day hashed invitation and sends only the raw bearer URL", async () => {
    const { repository, mailer } = makeDependencies();
    const service = makeService(repository, mailer);

    const created = await service.createInvitation(organizer, {
      email: "rahul@example.com",
      role: "MANAGER",
    });

    expect(created.expiresAt).toEqual(new Date("2026-11-05T10:00:00.000Z"));
    expect(repository.createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        weddingId: wedding.id,
        invitedByMembershipId: membership.id,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    const sent = vi.mocked(mailer.sendInvitation).mock.calls[0]![0];
    expect(sent.invitationUrl).toMatch(/^https:\/\/vivaahly\.example\/join\/[A-Za-z0-9_-]{43}$/);
    expect(sent.invitationUrl).not.toContain(created.tokenHash);
    expect(sent.coupleName).toBe("Deepesh & Priya");
    expect(sent.weddingTitle).toBe("Our Forever Begins");
  });

  it("validates the invitation origin before persisting an invitation", async () => {
    const { repository, mailer } = makeDependencies();
    const service = new OrganizerService({
      repository,
      mailer,
      appBaseUrl: () => {
        throw new Error("APP_BASE_URL is required in production.");
      },
      now: () => now,
    });

    await expect(
      service.createInvitation(organizer, {
        email: "rahul@example.com",
        role: "MANAGER",
      }),
    ).rejects.toThrow("APP_BASE_URL is required in production.");
    expect(repository.expirePendingInvitationForEmail).not.toHaveBeenCalled();
    expect(repository.createInvitation).not.toHaveBeenCalled();
    expect(mailer.sendInvitation).not.toHaveBeenCalled();
  });

  it("validates the invitation origin before rotating a resend token", async () => {
    const { repository, mailer } = makeDependencies();
    const service = new OrganizerService({
      repository,
      mailer,
      appBaseUrl: () => {
        throw new Error("APP_BASE_URL is required in production.");
      },
      now: () => now,
    });

    await expect(
      service.resendInvitation(organizer, invitation.id),
    ).rejects.toThrow("APP_BASE_URL is required in production.");
    expect(repository.rotateInvitation).not.toHaveBeenCalled();
    expect(mailer.sendInvitation).not.toHaveBeenCalled();
  });

  it("rejects Managers and duplicate pending invitations", async () => {
    const { repository, mailer } = makeDependencies();
    const service = makeService(repository, mailer);
    await expect(
      service.createInvitation(
        { ...organizer, membership: { ...membership, role: "MANAGER" } },
        { email: "rahul@example.com", role: "MANAGER" },
      ),
    ).rejects.toMatchObject({ status: 403 });

    vi.mocked(repository.createInvitation).mockRejectedValueOnce(
      new PendingOrganizerInvitationError(),
    );
    await expect(
      service.createInvitation(organizer, {
        email: "rahul@example.com",
        role: "MANAGER",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it.each([
    ["NEW_USER", null, null],
    ["SIGN_IN_REQUIRED", null, invitedUser],
    ["READY", { user: invitedUser, membership: null }, invitedUser],
    ["WRONG_ACCOUNT", organizer, invitedUser],
    [
      "ACTIVE_MEMBERSHIP_CONFLICT",
      {
        user: invitedUser,
        membership: { ...membership, weddingId: "another-wedding" },
      },
      invitedUser,
    ],
  ])("resolves %s invitation access safely", async (expected, current, existing) => {
    const { repository, mailer } = makeDependencies();
    vi.mocked(repository.findInvitationAccessByTokenHash).mockResolvedValue(
      accessRecord(existing as OrganizerUser | null),
    );
    const service = makeService(repository, mailer);
    const result = await service.getInvitationAccess(
      "raw-token",
      current as AuthenticatedOrganizer | null,
    );
    expect(result.state).toBe(expected);
    expect(result.invitation).not.toHaveProperty("email");
    expect(result.invitation?.invitedEmailMasked).toBe("r****@example.com");
  });

  it("accepts an invitation for the matching signed-in account", async () => {
    const { repository, mailer } = makeDependencies();
    vi.mocked(repository.findInvitationAccessByTokenHash).mockResolvedValue(
      accessRecord(invitedUser),
    );
    const service = makeService(repository, mailer);
    const current: AuthenticatedOrganizer = { user: invitedUser, membership: null };

    const accepted = await service.acceptInvitation("raw-token", current, {});

    expect(accepted.session).toBeNull();
    expect(repository.acceptInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ existingUserId: invitedUser.id }),
    );
  });

  it("creates the account, membership, and session through one acceptance operation", async () => {
    const { repository, mailer } = makeDependencies();
    const service = makeService(repository, mailer);

    const accepted = await service.acceptInvitation("raw-token", null, {
      name: "Rahul Sharma",
      password: "wedding plans forever",
    });

    expect(accepted.session?.rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(repository.acceptInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        newUser: expect.objectContaining({
          emailNormalized: invitation.emailNormalized,
          passwordHash: expect.stringMatching(/^\$argon2id\$/),
        }),
        newSession: expect.objectContaining({ tokenHash: expect.any(String) }),
      }),
    );
  });

  it("blocks wrong accounts and active-membership races with a 409", async () => {
    const { repository, mailer } = makeDependencies();
    vi.mocked(repository.findInvitationAccessByTokenHash).mockResolvedValue(
      accessRecord(invitedUser),
    );
    const service = makeService(repository, mailer);
    await expect(service.acceptInvitation("raw-token", organizer, {})).rejects.toMatchObject({
      status: 409,
      details: { reason: "ACCOUNT_MISMATCH" },
    });

    vi.mocked(repository.acceptInvitation).mockRejectedValueOnce(
      new OrganizerInvitationActiveMembershipError(),
    );
    await expect(
      service.acceptInvitation("raw-token", { user: invitedUser, membership: null }, {}),
    ).rejects.toMatchObject({
      status: 409,
      details: { reason: "ACTIVE_MEMBERSHIP" },
    });
  });

  it("returns a controlled conflict for a replayed invitation", async () => {
    const { repository, mailer } = makeDependencies();
    vi.mocked(repository.findInvitationAccessByTokenHash).mockResolvedValue({
      ...accessRecord(invitedUser),
      invitation: { ...invitation, status: "ACCEPTED", expiresAt: null },
    });
    const service = makeService(repository, mailer);
    await expect(
      service.acceptInvitation("raw-token", { user: invitedUser, membership: null }, {}),
    ).rejects.toBeInstanceOf(ApplicationError);
  });
});
