import { describe, expect, it } from "vitest";
import { classifyCampaignRecipientEligibility } from "@/modules/guest-invitations/guest-invitation.delivery";

describe("classifyCampaignRecipientEligibility", () => {
  it("keeps a pending recipient away from delivery when all assigned ceremonies are inactive", () => {
    const result = classifyCampaignRecipientEligibility(
      [{ recipientId: "recipient-1", guestId: "guest-1", invitationId: "invitation-1" }],
      new Set(["guest-1"]),
      new Set(["invitation-1"]),
      new Set(),
    );

    expect([...result.sendableRecipientIds]).toEqual([]);
    expect([...result.recipientIdsWithoutEvents]).toEqual(["recipient-1"]);
  });

  it("isolates unavailable recipients without blocking other eligible recipients", () => {
    const result = classifyCampaignRecipientEligibility(
      [
        { recipientId: "recipient-1", guestId: "guest-1", invitationId: "invitation-1" },
        { recipientId: "recipient-2", guestId: "guest-2", invitationId: "invitation-2" },
      ],
      new Set(["guest-1"]),
      new Set(["invitation-1", "invitation-2"]),
      new Set(["guest-1", "guest-2"]),
    );

    expect([...result.sendableRecipientIds]).toEqual(["recipient-1"]);
    expect([...result.unavailableRecipientIds]).toEqual(["recipient-2"]);
  });
});
