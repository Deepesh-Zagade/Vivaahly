import { describe, expect, it } from "vitest";
import { renderGuestInvitationEmail } from "@/server/providers/resend/guest-invitation-email";

const input = {
  recipientId: "recipient-1",
  campaignId: "campaign-1",
  guestId: "guest-1",
  guestInvitationId: "invitation-1",
  accessKey: "not-rendered-directly",
  attemptCount: 0,
  recipientEmail: "family@example.com",
  guestName: "Kulkarni Family",
  primaryContactName: "Rajesh Kulkarni",
  guestType: "FAMILY" as const,
  coupleName: "Anant & Radhika",
  weddingTitle: "Our Forever Begins",
  weddingDate: new Date("2027-02-14T00:00:00.000Z"),
  weddingTimezone: "Asia/Kolkata",
  weddingCity: "Virar",
  events: [
    {
      id: "event-1",
      title: { en: "Sangeet & Musical Evening" },
      startAt: new Date("2027-02-12T13:00:00.000Z"),
      endAt: new Date("2027-02-12T17:30:00.000Z"),
      venueName: "Royal Courtyard",
      dressCode: "Festive Indian",
    },
  ],
  invitationUrl: "https://vivaahly.bond/i/private-access-key",
  brandMarkUrl: "https://vivaahly.bond/brand/vivaahly-mark.png",
};

describe("renderGuestInvitationEmail", () => {
  it("renders the assigned ceremonies and personalized invitation action", () => {
    const email = renderGuestInvitationEmail(input);

    expect(email.subject).toContain("Anant & Radhika");
    expect(email.text).toContain("Sangeet & Musical Evening");
    expect(email.html).toContain("Royal Courtyard");
    expect(email.html).toContain("View wedding invitation");
    expect(email.html).toContain("https://vivaahly.bond/i/private-access-key");
    expect(email.html).toContain('src="https://vivaahly.bond/brand/vivaahly-mark.png"');
    expect(email.html).not.toContain("RSVP now");
  });

  it("escapes organizer-entered and guest-entered content", () => {
    const email = renderGuestInvitationEmail({
      ...input,
      guestName: "<Kulkarni & Family>",
      coupleName: "Anant & <Radhika>",
      events: [{ ...input.events[0], title: { en: "<Sangeet>" } }],
      invitationUrl: "https://example.com/i/key?a=1&b=2",
    });

    expect(email.html).toContain("Anant &amp; &lt;Radhika&gt;");
    expect(email.html).toContain("&lt;Sangeet&gt;");
    expect(email.html).not.toContain("<Kulkarni & Family>");
    expect(email.html).toContain("https://example.com/i/key?a=1&amp;b=2");
  });
});
