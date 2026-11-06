import "server-only";

import type { OrganizerInvitationMailer } from "@/modules/organizers/organizer.repository";
import { getEmailEnvironment } from "@/server/config/env.server";
import { ApplicationError, externalServiceError } from "@/server/http/errors";
import { logger } from "@/server/observability/logger";
import {
  ORGANIZER_INVITATION_LOGO_CONTENT_ID,
  VIVAAHLY_MARK_PNG_BASE64,
} from "@/server/providers/resend/organizer-invitation-email-assets";
import { renderOrganizerInvitationEmail } from "@/server/providers/resend/organizer-invitation-email";

export class ResendOrganizerInvitationMailer implements OrganizerInvitationMailer {
  async sendInvitation(input: Parameters<OrganizerInvitationMailer["sendInvitation"]>[0]) {
    try {
      const environment = getEmailEnvironment();
      const email = renderOrganizerInvitationEmail(input);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: {
          authorization: `Bearer ${environment.RESEND_API_KEY}`,
          "content-type": "application/json",
          "idempotency-key": `organizer-invitation/${input.invitationId}/${input.deliveryAttempt}`,
        },
        body: JSON.stringify({
          from: environment.RESEND_FROM_EMAIL,
          to: [input.recipientEmail],
          subject: email.subject,
          text: email.text,
          html: email.html,
          attachments: [
            {
              filename: "vivaahly-mark.png",
              content: VIVAAHLY_MARK_PNG_BASE64,
              content_type: "image/png",
              content_id: ORGANIZER_INVITATION_LOGO_CONTENT_ID,
            },
          ],
        }),
      });

      if (!response.ok) {
        let providerError: { name?: string; message?: string } = {};
        try {
          providerError = (await response.json()) as typeof providerError;
        } catch {
          // Resend may return an empty/non-JSON response during an upstream failure.
        }
        logger.error("Resend organizer invitation delivery failed", {
          provider: "resend",
          status: response.status,
          providerErrorName: providerError.name,
          providerErrorMessage: providerError.message,
        });
        if (
          response.status === 403 &&
          providerError.message?.includes("only send testing emails to your own email address")
        ) {
          throw externalServiceError(
            "Resend’s test sender can deliver only to the email address linked to your Resend account. Use that address for local email testing or verify a sending domain before inviting other recipients.",
          );
        }
        throw externalServiceError(
          "The invitation was saved, but email delivery could not be confirmed. Please try resending it.",
        );
      }
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw externalServiceError(
        "The invitation was saved, but email delivery could not be confirmed. Please try resending it.",
      );
    }
  }
}
