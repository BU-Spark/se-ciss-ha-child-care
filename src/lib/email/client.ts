import "server-only";

import { Resend } from "resend";

let client: Resend | null = null;

/** Lazily constructs the Resend client. Throws if RESEND_API_KEY is missing. */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}

/**
 * The verified "from" address. In dev you can use Resend's shared
 * onboarding@resend.dev sender; production needs a verified domain.
 */
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "EEC Orientation <onboarding@resend.dev>";
}