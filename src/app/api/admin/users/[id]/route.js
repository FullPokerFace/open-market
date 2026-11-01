// DELETE: the admin removes an account and everything saved for it (watchlists, send log, sessions), like
// "Delete my account" does for a visitor. They can sign up again with the same email.
import { isAdmin } from "@/lib/admin";
import { deleteAuthUser, getAuth } from "@/lib/auth";
import { sameOrigin } from "@/lib/rate-limit";
import { deleteWatchlistData } from "@/lib/watchlists";

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);
  // Without the admin session, a plain 404
  if (!(await isAdmin())) return reply({ error: "Not found." }, 404);
  const { id } = await params;
  try {
    const { internalAdapter } = await getAuth().$context;
    const user = await internalAdapter.findUserById(id).catch(() => null);
    if (!user) return reply({ error: "That account is already gone." }, 404);
    await deleteWatchlistData(user.id);
    await deleteAuthUser(user.id);
    console.log(`[admin] deleted user ${user.id}`);
    return reply({ deleted: true });
  } catch (error) {
    console.error(error);
    return reply({ error: "Couldn't delete the account. Please try again." }, 503);
  }
}
