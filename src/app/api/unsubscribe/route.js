// POST ?u=<user id>&t=<signature>: turns off earnings notifications on all the user's watchlists.
// Called by mail apps' one-click Unsubscribe (List-Unsubscribe-Post) and by the button on /unsubscribe.
// No sign-in needed: the signature proves the link came from one of our emails.
import { validUnsubscribe, turnOffNotifications } from "@/lib/watchlists";

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const params = new URL(request.url).searchParams;
  const userId = params.get("u");
  if (!validUnsubscribe(userId, params.get("t"))) return reply({ error: "This unsubscribe link isn't valid." }, 400);
  try {
    await turnOffNotifications(userId);
    return reply({ unsubscribed: true });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't unsubscribe. Please try again." }, 503);
  }
}
