// Server-only: sends mail through Gmail SMTP with an app password (same setup as FedWatch).
// Call only from the Node.js runtime and await it before responding.
import "server-only";
import nodemailer from "nodemailer";

export function emailConfigured() {
  return Boolean(process.env.GMAIL_SENDER_ADDRESS?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

// Sends to the owner's own inbox unless `to` is given
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const user = process.env.GMAIL_SENDER_ADDRESS?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) throw new Error("Email is not configured. Set GMAIL_SENDER_ADDRESS and GMAIL_APP_PASSWORD.");

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    dnsTimeout: 5000,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });

  try {
    const result = await transport.sendMail({
      from: { name: "Earnings Report", address: user },
      to: to ?? user,
      replyTo,
      subject,
      text,
      html,
    });
    // SMTP acceptance is not confirmation of inbox delivery
    return { messageId: result.messageId, accepted: result.accepted, rejected: result.rejected };
  } finally {
    transport.close();
  }
}
