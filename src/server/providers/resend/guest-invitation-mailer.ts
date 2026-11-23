import "server-only";

import { createHash } from "node:crypto";
import type { DeliveryResult } from "@/modules/guest-invitations/guest-invitation.repository";
import type { InvitationEmailContext } from "@/modules/guest-invitations/guest-invitation.types";
import { getAppBaseUrl, getEmailEnvironment } from "@/server/config/env.server";
import { renderGuestInvitationEmail } from "@/server/providers/resend/guest-invitation-email";

export interface GuestInvitationMailer {
  sendBatch(contexts: InvitationEmailContext[]): Promise<DeliveryResult[]>;
}

function recipientKey(context: InvitationEmailContext) {
  const identity = `${context.recipientId}:${context.attemptCount + 1}`;
  return `guest-invitations/${context.campaignId}/${createHash("sha256").update(identity).digest("hex").slice(0, 32)}`;
}

function deliveryFailureMessage(providerMessage: string) {
  const normalized = providerMessage.toLowerCase();
  if (
    normalized.includes("invalid `to` field") ||
    normalized.includes("testing email address") ||
    normalized.includes("example.com")
  ) {
    return "The email provider rejected this recipient address. Use a real deliverable address or an approved testing recipient.";
  }
  return "The email provider could not accept this invitation. Review the recipient address and try again.";
}

export class ResendGuestInvitationMailer implements GuestInvitationMailer {
  async sendBatch(contexts: InvitationEmailContext[]): Promise<DeliveryResult[]> {
    if (!contexts.length) return [];
    const environment = getEmailEnvironment();
    const appBaseUrl = getAppBaseUrl();
    return mapWithConcurrency(contexts, 8, async (context) => {
      const email = renderGuestInvitationEmail({
        ...context,
        invitationUrl: `${appBaseUrl}/i/${encodeURIComponent(context.accessKey)}`,
        brandMarkUrl: `${appBaseUrl}/brand/vivaahly-mark.png`,
      });
      const message = {
        from: environment.RESEND_FROM_EMAIL,
        to: [context.recipientEmail],
        subject: email.subject,
        text: email.text,
        html: email.html,
      };
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(15_000),
          headers: {
            authorization: `Bearer ${environment.RESEND_API_KEY}`,
            "content-type": "application/json",
            "idempotency-key": recipientKey(context),
          },
          body: JSON.stringify(message),
        });
        if (!response.ok) {
          let providerMessage = "Resend could not accept this invitation.";
          try {
            const body = (await response.json()) as { message?: string };
            if (body.message) providerMessage = body.message;
          } catch {
            // Keep the safe provider-independent message.
          }
          return {
            recipientId: context.recipientId,
            sent: false,
            errorCode: `RESEND_${response.status}`,
            errorMessage: deliveryFailureMessage(providerMessage),
          };
        }
        const body = (await response.json()) as { id?: string };
        return {
          recipientId: context.recipientId,
          sent: true,
          ...(body.id ? { providerMessageId: body.id } : {}),
        };
      } catch {
        return {
          recipientId: context.recipientId,
          sent: false,
          errorCode: "RESEND_UNAVAILABLE",
          errorMessage: "Email sending is temporarily unavailable. Please retry this recipient.",
        };
      }
    });
  }
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const runners = Array.from(
    { length: Math.min(Math.max(concurrency, 1), values.length) },
    async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(values[index]);
      }
    },
  );
  await Promise.all(runners);
  return results;
}
