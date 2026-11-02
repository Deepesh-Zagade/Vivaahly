import type { WeddingMemberRole } from "@/modules/wedding/wedding.types";

export type OrganizerInvitationEmailInput = {
  recipientEmail: string;
  inviterName: string;
  weddingTitle: string;
  coupleName: string;
  role: WeddingMemberRole;
  invitationUrl: string;
  expiresAt: Date;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderOrganizerInvitationEmail(input: OrganizerInvitationEmailInput) {
  const coupleName = escapeHtml(input.coupleName);
  const weddingTitle = escapeHtml(input.weddingTitle);
  const inviterName = escapeHtml(input.inviterName);
  const invitationUrl = escapeHtml(input.invitationUrl);
  const role = input.role === "ADMIN" ? "Admin" : "Manager";
  const expiry = input.expiresAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return {
    subject: `${input.coupleName} invited you to their wedding team on Vivaahly`,
    text: [
      `You’re invited to help plan ${input.coupleName}’s wedding.`,
      input.weddingTitle,
      `${input.inviterName} invited you to join their private Vivaahly wedding workspace as a ${role}.`,
      `Review your invitation: ${input.invitationUrl}`,
      `This invitation expires ${expiry}.`,
    ].join("\n\n"),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Vivaahly organizer invitation</title>
  </head>
  <body style="margin:0;padding:0;background:#faf2f0;color:#1e1b1a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${coupleName} would love your help planning their wedding.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#faf2f0;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #eee6e4;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(84,20,47,.08);">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #eee6e4;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1;color:#54142f;">Vivaahly</td>
                    <td align="right"><span style="display:inline-block;padding:6px 10px;border-radius:999px;background:#f4ecea;color:#524347;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Organizer invitation</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;background:#54142f;color:#ffffff;">
                <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#ffdbd2;">You’re invited</div>
                <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:400;line-height:1.15;color:#ffffff;">Help plan ${coupleName}’s wedding</h1>
                <p style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-style:italic;line-height:1.35;color:#ffb1c8;">“${weddingTitle}”</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:16px;line-height:1.7;color:#524347;"><strong style="color:#1e1b1a;">${inviterName}</strong> invited you to join the family’s private wedding workspace and help coordinate the celebration.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:24px 0;background:#faf2f0;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;border-bottom:1px solid #eee6e4;color:#524347;font-size:13px;">Your role</td>
                    <td align="right" style="padding:18px 20px;border-bottom:1px solid #eee6e4;"><span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#ffdbd2;color:#713626;font-size:12px;font-weight:700;">${role}</span></td>
                  </tr>
                  <tr>
                    <td style="padding:18px 20px;color:#524347;font-size:13px;">Invitation expires</td>
                    <td align="right" style="padding:18px 20px;color:#1e1b1a;font-size:13px;font-weight:700;">${expiry}</td>
                  </tr>
                </table>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                  <tr>
                    <td align="center" style="border-radius:10px;background:#702b45;">
                      <a href="${invitationUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;">Review invitation&nbsp;&nbsp;→</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;text-align:center;color:#857277;font-size:12px;line-height:1.6;">This private link is intended only for ${escapeHtml(input.recipientEmail)}. If you were not expecting this invitation, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f4ecea;text-align:center;color:#524347;font-size:12px;line-height:1.6;">Less coordination. More celebration.<br><span style="color:#857277;">If the button does not work, copy this link into your browser:<br><a href="${invitationUrl}" style="color:#702b45;word-break:break-all;">${invitationUrl}</a></span></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
