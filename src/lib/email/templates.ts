// Plain data shape the templates need — keep this decoupled from Prisma types
// so the email layer doesn't depend on the ORM.
export type SessionEmailInfo = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  locationName: string | null;
  address: string | null;
  meetingUrl: string | null;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

const BRAND_NAVY = "#1a2f5e";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatWhen(start: Date, end: Date): string {
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
  return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${timeFmt.format(end)} ET`;
}

function locationLines(session: SessionEmailInfo): { html: string; text: string } {
  if (session.meetingUrl) {
    const safe = escapeHtml(session.meetingUrl);
    return {
      html: `<p style="margin:4px 0;color:#3f4754;"><strong>Join link:</strong> <a href="${safe}" style="color:${BRAND_NAVY};">${safe}</a></p>`,
      text: `Join link: ${session.meetingUrl}`,
    };
  }
  const where = [session.locationName, session.address].filter(Boolean).join(", ");
  if (where) {
    return {
      html: `<p style="margin:4px 0;color:#3f4754;"><strong>Location:</strong> ${escapeHtml(where)}</p>`,
      text: `Location: ${where}`,
    };
  }
  return { html: "", text: "" };
}

function wrap(bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:${BRAND_NAVY};color:#ffffff;padding:16px 24px;border-radius:8px 8px 0 0;font-weight:600;">EEC Orientation</div>
    <div style="background:#ffffff;padding:24px;border:1px solid #e2e6ed;border-top:none;border-radius:0 0 8px 8px;">
      ${bodyHtml}
    </div>
    <p style="color:#9aa3af;font-size:12px;margin-top:16px;text-align:center;">Massachusetts Department of Early Education and Care</p>
  </div></body></html>`;
}

export function registrationConfirmationEmail(opts: {
  providerName: string;
  session: SessionEmailInfo;
}): RenderedEmail {
  const { providerName, session } = opts;
  const when = formatWhen(session.startsAt, session.endsAt);
  const loc = locationLines(session);
  const name = escapeHtml(providerName);
  const title = escapeHtml(session.title);

  return {
    subject: `You're registered: ${session.title}`,
    html: wrap(
      `<h1 style="font-size:20px;color:${BRAND_NAVY};margin:0 0 12px;">Registration confirmed</h1>
       <p style="color:#3f4754;margin:0 0 16px;">Hi ${name}, you're confirmed for the following orientation session:</p>
       <div style="background:#f8f9fb;border:1px solid #e2e6ed;border-radius:8px;padding:16px;">
         <p style="margin:0 0 4px;font-weight:600;color:#1f2733;">${title}</p>
         <p style="margin:4px 0;color:#3f4754;"><strong>When:</strong> ${when}</p>
         ${loc.html}
       </div>
       <p style="color:#3f4754;margin:16px 0 0;">We'll send a reminder before the session. If you need to cancel, please do so from your dashboard.</p>`,
    ),
    text: `Registration confirmed\n\nHi ${providerName}, you're confirmed for:\n${session.title}\nWhen: ${when}\n${loc.text}\n\nWe'll send a reminder before the session.`,
  };
}

export function sessionFollowUpEmail(opts: {
  providerName: string;
  session: SessionEmailInfo;
}): RenderedEmail {
  const { providerName, session } = opts;
  const when = formatWhen(session.startsAt, session.endsAt);
  const name = escapeHtml(providerName);
  const title = escapeHtml(session.title);

  return {
    subject: `Follow-up: ${session.title}`,
    html: wrap(
      `<h1 style="font-size:20px;color:${BRAND_NAVY};margin:0 0 12px;">Thank you for attending</h1>
       <p style="color:#3f4754;margin:0 0 16px;">Hi ${name}, thank you for taking part in <strong>${title}</strong> on ${when}.</p>
       <p style="color:#3f4754;margin:0 0 16px;">If you have any questions about next steps in the orientation process, reply to this email and a CCR&amp;R staff member will follow up with you.</p>`,
    ),
    text: `Thank you for attending\n\nHi ${providerName}, thank you for taking part in ${session.title} on ${when}.\n\nIf you have questions about next steps, reply to this email and a CCR&R staff member will follow up.`,
  };
}