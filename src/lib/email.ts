import { Resend } from "resend";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // In Resend test mode (unverified domain), you can only send to your own
  // account email. This override redirects ALL mail there so you can test today.
  // Unset DIGEST_TEST_OVERRIDE_TO once the domain verifies to send for real.
  const recipient = process.env.DIGEST_TEST_OVERRIDE_TO || to;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from,
    to: recipient,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend send failed: ${JSON.stringify(error)}`);
  }

  return data;
}
