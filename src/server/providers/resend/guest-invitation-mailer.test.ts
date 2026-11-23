import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvitationEmailContext } from "@/modules/guest-invitations/guest-invitation.types";
import { ResendGuestInvitationMailer } from "@/server/providers/resend/guest-invitation-mailer";

function context(recipientId: string, recipientEmail: string): InvitationEmailContext {
  return {
    recipientId,
    campaignId: "campaign-1",
    guestId: `guest-${recipientId}`,
    guestInvitationId: `invitation-${recipientId}`,
    accessKey: `private-${recipientId}`,
    attemptCount: 0,
    recipientEmail,
    guestName: `Guest ${recipientId}`,
    primaryContactName: `Contact ${recipientId}`,
    guestType: "INDIVIDUAL",
    coupleName: "Anant & Radhika",
    weddingTitle: "Our Forever Begins",
    weddingDate: new Date("2027-02-14T00:00:00.000Z"),
    weddingTimezone: "Asia/Kolkata",
    weddingCity: "Virar",
    events: [],
  };
}

describe("ResendGuestInvitationMailer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("isolates a rejected recipient without failing valid recipients", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "Vivaahly <invitations@vivaahly.test>");
    vi.stubEnv("APP_BASE_URL", "https://qa.vivaahly.bond");
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const message = JSON.parse(String(init?.body)) as { to: string[] };
      if (message.to[0] === "invalid@example.com") {
        return new Response(JSON.stringify({ message: "Invalid `to` field." }), {
          status: 422,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ id: "email-valid" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await new ResendGuestInvitationMailer().sendBatch([
      context("recipient-invalid", "invalid@example.com"),
      context("recipient-valid", "valid@vivaahly.test"),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every(([url]) => String(url) === "https://api.resend.com/emails")).toBe(true);
    const sentMessages = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)) as { html: string; attachments?: unknown[] });
    expect(sentMessages.every((message) => message.html.includes('src="https://qa.vivaahly.bond/brand/vivaahly-mark.png"'))).toBe(true);
    expect(sentMessages.every((message) => message.attachments === undefined)).toBe(true);
    expect(results).toEqual([
      expect.objectContaining({ recipientId: "recipient-invalid", sent: false, errorCode: "RESEND_422" }),
      { recipientId: "recipient-valid", sent: true, providerMessageId: "email-valid" },
    ]);
  });
});
