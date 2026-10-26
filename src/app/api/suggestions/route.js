import { cookies } from "next/headers";
import { emailConfigured, sendEmail } from "@/lib/email";
import { isFlagged, openaiConfigured, suggestionCard } from "@/lib/openai";
import { rateLimit, sameOrigin, visitor } from "@/lib/rate-limit";
import { buildSuggestionEmail } from "@/lib/suggestion-email";
import { listSuggestions, saveSuggestion, suggestionsToCompare, voterFrom } from "@/lib/suggestions";

// Runs on Node.js (the default; `runtime` can't be set with cacheComponents), which nodemailer needs
export const maxDuration = 30;

const MAX_LENGTH = 2000;
const overLimit = rateLimit(3);

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// The suggestion board, with this visitor's votes
export async function GET() {
  try {
    const voter = voterFrom(await cookies());
    return reply({ suggestions: await listSuggestions(voter) });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't load suggestions." }, 503);
  }
}

// New suggestion from the dialog: POST { message }. It's moderated, turned into a card by OpenAI
// (or merged into the card it duplicates), saved with the author's upvote, and emailed to GMAIL_SENDER_ADDRESS.
export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);

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

  if (!openaiConfigured()) return reply({ error: "Suggestions are temporarily unavailable." }, 503);
  if (overLimit(visitor(request))) return reply({ error: "Thanks! That's a lot of ideas. Try again in an hour." }, 429);

  let suggestion;
  try {
    if (await isFlagged(message)) return reply({ error: "That can't be posted. Keep it about a feature for the site." }, 400);
    const card = await suggestionCard(message, await suggestionsToCompare());
    suggestion = await saveSuggestion({ message, card, voter: voterFrom(await cookies(), { create: true }) });
    if (!suggestion) throw new Error("Saved suggestion not found");
  } catch (error) {
    console.error(error);
    return reply({ error: "We couldn't post that. Please try again shortly." }, 503);
  }

  // The suggestion is saved either way; the email is only a heads-up for the developer
  const merged = suggestion.requests > 1;
  if (emailConfigured()) {
    try {
      await sendEmail(buildSuggestionEmail({ message, card: suggestion, merged, site: new URL(request.url).origin }));
    } catch (error) {
      console.error("[email] suggestion email failed", error);
    }
  }
  return reply({ suggestion, merged });
}
