import { sendEmail } from "@/lib/email";

type RegistrationConfirmationEmail = {
  to: string;
  providerName: string;
  session: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    format: "VIRTUAL" | "IN_PERSON";
    meetingUrl: string | null;
    locationName: string | null;
    address: string | null;
  };
};

export async function sendRegistrationConfirmationEmail({
  to,
  providerName,
  session,
}: RegistrationConfirmationEmail) {
  await sendEmail({
    to,
    subject: `Registration confirmed — ${session.title}`,
    html: buildRegistrationConfirmationHtml({ providerName, session }),
  });
}

function buildRegistrationConfirmationHtml({
  providerName,
  session,
}: Omit<RegistrationConfirmationEmail, "to">) {
  const sessionTime = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).formatRange(session.startsAt, session.endsAt);

  const attendanceDetails =
    session.format === "VIRTUAL"
      ? session.meetingUrl
        ? `<p><strong>Join link:</strong> <a href="${escapeHtml(session.meetingUrl)}">Join the information session</a></p>`
        : "<p>We will send the session join details separately.</p>"
      : `<p><strong>Location:</strong> ${escapeHtml([session.locationName, session.address].filter(Boolean).join(", ") || "Details will be shared separately.")}</p>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;color:#1f2937;line-height:1.5;">
      <h1 style="color:#1a2f5e;font-size:24px;">You’re registered</h1>
      <p>Hello ${escapeHtml(providerName)},</p>
      <p>Thank you for registering for the following EEC information session.</p>
      <p><strong>${escapeHtml(session.title)}</strong><br>${escapeHtml(sessionTime)} ET</p>
      ${attendanceDetails}
      <p>Please save this email for your session details.</p>
    </div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
  );
}
