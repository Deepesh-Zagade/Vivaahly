import type { InvitationEmailContext } from "@/modules/guest-invitations/guest-invitation.types";

export type GuestInvitationEmailInput = InvitationEmailContext & {
  invitationUrl: string;
  brandMarkUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

function formatEventTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

export function renderGuestInvitationEmail(input: GuestInvitationEmailInput) {
  const guestName = escapeHtml(input.guestName);
  const coupleName = escapeHtml(input.coupleName);
  const weddingTitle = escapeHtml(input.weddingTitle);
  const invitationUrl = escapeHtml(input.invitationUrl);
  const brandMarkUrl = escapeHtml(input.brandMarkUrl);
  const greetingName = escapeHtml(input.primaryContactName || input.guestName);
  const events = input.events
    .map((event) => {
      const location = [event.venueName, event.venueAddress]
        .filter(Boolean)
        .map((value) => escapeHtml(value!))
        .join(" · ");
      const schedule = `${formatEventDate(event.startAt, input.weddingTimezone)} · ${formatEventTime(event.startAt, input.weddingTimezone)}–${formatEventTime(event.endAt, input.weddingTimezone)}`;
      return `<tr>
        <td style="padding:16px 0;border-bottom:1px solid #eee6e4;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.25;color:#54142f;">${escapeHtml(event.title.en)}</div>
          <div style="margin-top:6px;font-size:13px;line-height:1.65;color:#524347;">${escapeHtml(schedule)}</div>
          ${location ? `<div style="font-size:13px;line-height:1.65;color:#524347;">${location}</div>` : ""}
          ${event.dressCode ? `<div style="font-size:12px;line-height:1.65;color:#8e4c3b;">Dress code: ${escapeHtml(event.dressCode)}</div>` : ""}
        </td>
      </tr>`;
    })
    .join("");
  const plainEvents = input.events
    .map((event) => {
      const location = [event.venueName, event.venueAddress].filter(Boolean).join(", ");
      return [
        event.title.en,
        `${formatEventDate(event.startAt, input.weddingTimezone)}, ${formatEventTime(event.startAt, input.weddingTimezone)}–${formatEventTime(event.endAt, input.weddingTimezone)}`,
        location,
        event.dressCode ? `Dress code: ${event.dressCode}` : "",
      ].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return {
    subject: `The wedding celebration of ${input.coupleName}`,
    text: [
      `Namaste ${input.primaryContactName || input.guestName},`,
      `${input.coupleName} and their families warmly invite ${input.guestType === "FAMILY" ? "your family" : "you"} to celebrate their wedding.`,
      input.weddingTitle,
      "Your invited ceremonies:",
      plainEvents || "Ceremony details will be shared soon.",
      `View wedding invitation: ${input.invitationUrl}`,
      `This personalized invitation is intended for ${input.guestName}. Please do not forward it.`,
    ].join("\n\n"),
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vivaahly wedding invitation</title></head>
  <body style="margin:0;padding:0;background:#faf2f0;color:#1e1b1a;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${coupleName} and their families warmly invite you to celebrate with them.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#faf2f0;">
      <tr><td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border:1px solid #eee6e4;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(84,20,47,.08);">
          <tr><td style="padding:22px 28px;border-bottom:1px solid #eee6e4;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
              <td width="46" style="width:46px;padding-right:10px;"><img src="${brandMarkUrl}" width="36" height="36" alt="V" style="display:block;width:36px;height:36px;border:0;color:#54142f;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;"></td>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1;color:#54142f;">Vivaahly</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:38px 28px;background:#54142f;color:#ffffff;text-align:center;">
            <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#ffdbd2;">Together with their families</div>
            <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:42px;font-weight:400;line-height:1.12;color:#ffffff;">${coupleName}</h1>
            ${weddingTitle && weddingTitle !== coupleName ? `<p style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;line-height:1.35;color:#ffb1c8;">“${weddingTitle}”</p>` : ""}
          </td></tr>
          <tr><td style="padding:30px 28px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.35;color:#54142f;">Namaste ${greetingName},</p>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.75;color:#524347;">With the blessings of our elders and immense joy in our hearts, we invite ${input.guestType === "FAMILY" ? "you and your family" : "you"} to celebrate this new beginning with us.</p>
            <div style="margin:26px 0 8px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8e4c3b;">Your invited ceremonies</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">${events || `<tr><td style="padding:16px 0;color:#524347;">Ceremony details will be shared soon.</td></tr>`}</table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0;"><tr><td align="center" style="border-radius:11px;background:#702b45;">
              <a href="${invitationUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1.2;">View wedding invitation&nbsp;&nbsp;→</a>
            </td></tr></table>
            <p style="margin:24px 0 0;text-align:center;color:#857277;font-size:12px;line-height:1.6;">This personalized invitation is intended for ${guestName}${input.guestType === "FAMILY" ? " and family" : ""}. Please do not forward it.</p>
          </td></tr>
          <tr><td style="padding:18px 28px;background:#f4ecea;text-align:center;color:#524347;font-size:12px;line-height:1.6;">Less coordination. More celebration.<br><span style="color:#857277;">Vivaahly · ${escapeHtml(input.weddingCity)}</span></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
