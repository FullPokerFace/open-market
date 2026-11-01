// Server-only: mail to visitors (sign-in codes, morning earnings emails) through Resend.
// Suggestions to the owner still go through Gmail in email.js.
import "server-only";
import { Resend } from "resend";

// Resend's batch endpoint takes at most this many emails per call
export const BATCH_LIMIT = 100;

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

function client() {
  if (!resendConfigured()) throw new Error("Email to visitors is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  globalThis.resend ??= new Resend(process.env.RESEND_API_KEY.trim());
  return globalThis.resend;
}

const withSender = (message) => ({ from: process.env.EMAIL_FROM.trim(), ...message });

// One email: { to, subject, text, html, headers }. Throws when Resend refuses it.
export async function sendOne(message, { idempotencyKey } = {}) {
  const { data, error } = await client().emails.send(withSender(message), { idempotencyKey });
  if (error) throw new Error(`Resend: ${error.message}`);
  return data.id;
}

// Up to BATCH_LIMIT emails in one call; all are sent or none. Returns their ids in order.
export async function sendBatch(messages, { idempotencyKey } = {}) {
  const { data, error } = await client().batch.send(messages.map(withSender), { idempotencyKey });
  if (error) throw new Error(`Resend batch: ${error.message}`);
  return data.data.map((email) => email.id);
}
