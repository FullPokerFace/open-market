// The signed-in visitor's watchlists. The browser keeps a copy (ticker-lists.js) and sends every change here.
import { currentUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/rate-limit";
import { getWatchlists, saveWatchlists } from "@/lib/watchlists";

// Twenty full lists come to about 15 KB; anything far bigger isn't from the page
const MAX_BODY = 64 * 1024;

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request) {
  try {
    const user = await currentUser(request.headers);
    if (!user) return reply({ error: "Not signed in." }, 401);
    return reply({ userId: user.id, lists: await getWatchlists(user.id) });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't load your watchlists." }, 503);
  }
}

// PUT { lists }: replaces the saved lists with these (cleaned to the limits); answers with what was saved
export async function PUT(request) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply({ error: "Too much data." }, 413);
    body = JSON.parse(raw);
  } catch {
    return reply({ error: "Invalid request." }, 400);
  }
  if (!Array.isArray(body?.lists)) return reply({ error: "Invalid request." }, 400);

  try {
    const user = await currentUser(request.headers);
    if (!user) return reply({ error: "Not signed in." }, 401);
    return reply({ userId: user.id, lists: await saveWatchlists(user, body.lists) });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't save your watchlists." }, 503);
  }
}
