import { cookies } from "next/headers";
import { rateLimit, sameOrigin, visitor } from "@/lib/rate-limit";
import { parseId, voteSuggestion, voterFrom } from "@/lib/suggestions";

// Votes per visitor an hour: plenty for clicking around the board, not for scripting it
const overLimit = rateLimit(120);

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// This visitor's vote on one card: POST { value } with 1 (up), -1 (down) or 0 (take it back).
// One vote per card per visitor, kept by the anonymous voter cookie.
export async function POST(request, { params }) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);

  const id = parseId((await params).id);
  const body = await request.json().catch(() => null);
  const value = body?.value;
  if (!id || ![1, -1, 0].includes(value)) return reply({ error: "Invalid vote." }, 400);
  if (overLimit(visitor(request))) return reply({ error: "That's a lot of votes. Try again later." }, 429);

  try {
    const suggestion = await voteSuggestion({ id, value, voter: voterFrom(await cookies(), { create: true }) });
    if (!suggestion) return reply({ error: "That suggestion is gone." }, 404);
    if (suggestion.done) return reply({ error: "That one's already built, so it takes no more votes." }, 409);
    return reply({ suggestion });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't save your vote. Please try again." }, 503);
  }
}
