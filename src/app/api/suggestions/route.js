import { emailConfigured, sendEmail } from "@/lib/email";
import { buildSuggestionEmail } from "@/lib/suggestion-email";

// Runs on Node.js (the default; `runtime` can't be set with cacheComponents), which nodemailer needs
export const maxDuration = 30;

const MAX_LENGTH = 2000;
// Per visitor: at most this many suggestions an hour. Kept in memory, so it resets on
// restart and isn't shared between server instances: enough to stop a stuck button or a casual flood.
const HOURLY_LIMIT = 5;
const HOUR_MS = 60 * 60 * 1000;
const recent = new Map();

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function visitor(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function overLimit(id) {
  const now = Date.now();
  const times = (recent.get(id) ?? []).filter((t) => now - t < HOUR_MS);
  if (times.length >= HOURLY_LIMIT) return true;
  recent.set(id, [...times, now]);
  return false;
}

// Feature suggestion from the header dialog, emailed to GMAIL_SENDER_ADDRESS: POST { message }
export async function POST(request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Request not allowed." }, 403);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_LENGTH * 2) return reply({ error: "Suggestion is too long." }, 413);
    body = JSON.parse(raw);
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (message.length < 3) return reply({ error: "Write a few words about the feature." }, 400);
  if (message.length > MAX_LENGTH) return reply({ error: `Keep it under ${MAX_LENGTH} characters.` }, 400);

  if (!emailConfigured()) return reply({ error: "Suggestions are temporarily unavailable." }, 503);
  if (overLimit(visitor(request))) return reply({ error: "Thanks! That's a lot of ideas. Try again in an hour." }, 429);

  try {
    const result = await sendEmail(buildSuggestionEmail({ message, site: new URL(request.url).origin }));
    if (!result.accepted?.length || result.rejected?.length) throw new Error("Not accepted");
    return reply({ sent: true });
  } catch (error) {
    console.error(error);
    return reply({ error: "We couldn't send that. Please try again shortly." }, 503);
  }
}
