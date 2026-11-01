// DELETE: removes the signed-in visitor's account and everything saved for it (watchlists, email, send log).
// The watchlists in their browser stay, with notifications off.
import { currentUser, deleteAuthUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/rate-limit";
import { deleteWatchlistData } from "@/lib/watchlists";

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function DELETE(request) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);
  try {
    const user = await currentUser(request.headers);
    if (!user) return reply({ error: "Not signed in." }, 401);
    await deleteWatchlistData(user.id);
    await deleteAuthUser(user.id);
    return reply({ deleted: true });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't delete your account. Please try again." }, 503);
  }
}
