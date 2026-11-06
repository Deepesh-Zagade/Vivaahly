import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/config/env.server", () => ({
  getEmailEnvironment: () => ({
    RESEND_API_KEY: "test-key",
    RESEND_FROM_EMAIL: "Vivaahly <invitations@vivaahly.bond>",
  }),
}));

vi.mock("@/server/observability/logger", () => ({
  logger: { error: vi.fn() },
}));

import { ResendOrganizerInvitationMailer } from "@/server/providers/resend/organizer-invitation-mailer";

describe("ResendOrganizerInvitationMailer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the Vivaahly mark as an inline CID attachment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await new ResendOrganizerInvitationMailer().sendInvitation({
      invitationId: "invitation-1",
      deliveryAttempt: "1",
      recipientEmail: "family@example.com",
      inviterName: "Deepesh",
      weddingTitle: "Our Forever Begins",
      coupleName: "Deepesh & Priya",
      role: "MANAGER",
      invitationUrl: "http://localhost:3000/join/secure-token",
      expiresAt: new Date("2026-11-07T00:00:00.000Z"),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as {
      html: string;
      attachments: Array<{
        filename: string;
        content: string;
        content_type: string;
        content_id: string;
      }>;
    };

    expect(payload.html).toContain('src="cid:vivaahly-mark"');
    expect(payload.attachments).toEqual([
      expect.objectContaining({
        filename: "vivaahly-mark.png",
        content_type: "image/png",
        content_id: "vivaahly-mark",
        content: expect.stringMatching(/^iVBORw0KGgo/),
      }),
    ]);
  });
});
