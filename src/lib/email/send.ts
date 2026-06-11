import "server-only";

import { getEmailFrom, getResendClient } from "./client";
import {
  registrationConfirmationEmail,
  sessionFollowUpEmail,
  type SessionEmailInfo,
} from "./templates";

export async function sendRegistrationConfirmation(opts: {
  to: string;
  providerName: string;
  session: SessionEmailInfo;
}) {
  const { subject, html, text } = registrationConfirmationEmail({
    providerName: opts.providerName,
    session: opts.session,
  });

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: opts.to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }

  return data;
}

export async function sendSessionFollowUp(opts: {
  to: string;
  providerName: string;
  session: SessionEmailInfo;
}) {
  const { subject, html, text } = sessionFollowUpEmail({
    providerName: opts.providerName,
    session: opts.session,
  });

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: opts.to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send follow-up email: ${error.message}`);
  }

  return data;
}