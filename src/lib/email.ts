import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  // In Resend test mode (unverified domain), you can only send to your own
  // account email. This override redirects ALL mail there so you can test today.
  // Unset DIGEST_TEST_OVERRIDE_TO once the domain verifies to send for real.
  const recipient = process.env.DIGEST_TEST_OVERRIDE_TO || to;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const resend = getResend();
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