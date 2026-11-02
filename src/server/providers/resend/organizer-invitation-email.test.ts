import { describe, expect, it } from "vitest";
import { renderOrganizerInvitationEmail } from "@/server/providers/resend/organizer-invitation-email";

describe("renderOrganizerInvitationEmail", () => {
  it("includes the couple, wedding title, role, expiry, and invitation action", () => {
    const email = renderOrganizerInvitationEmail({
      recipientEmail: "rahul@example.com",
      inviterName: "Deepesh Patil",
      coupleName: "Deepesh & Priya",
      weddingTitle: "Our Forever Begins",
      role: "MANAGER",
      invitationUrl: "https://vivaahly.bond/join/secure-token",
      expiresAt: new Date("2026-11-07T00:00:00.000Z"),
    });

    expect(email.subject).toContain("Deepesh & Priya");
    expect(email.text).toContain("Our Forever Begins");
    expect(email.html).toContain("Deepesh &amp; Priya");
    expect(email.html).toContain("Our Forever Begins");
    expect(email.html).toContain("Manager");
    expect(email.html).toContain("7 November 2026");
    expect(email.html).toContain("https://vivaahly.bond/join/secure-token");
  });

  it("escapes invitation content before placing it in HTML", () => {
    const email = renderOrganizerInvitationEmail({
      recipientEmail: "rahul@example.com",
      inviterName: "<Admin>",
      coupleName: "Deepesh & <Priya>",
      weddingTitle: "Our <Forever>",
      role: "ADMIN",
      invitationUrl: "https://example.com/join?a=1&b=2",
      expiresAt: new Date("2026-11-07T00:00:00.000Z"),
    });

    expect(email.html).toContain("Deepesh &amp; &lt;Priya&gt;");
    expect(email.html).toContain("Our &lt;Forever&gt;");
    expect(email.html).not.toContain("<Admin>");
    expect(email.html).toContain("https://example.com/join?a=1&amp;b=2");
  });
});
