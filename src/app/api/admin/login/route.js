// POST { password } signs in to the admin panel; DELETE signs out
import { adminConfigured, checkAdminPassword, endAdminSession, startAdminSession } from "@/lib/admin";
import { rateLimit, sameOrigin, visitor } from "@/lib/rate-limit";

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Wrong passwords per visitor an hour, so the password can't be guessed by brute force
const overLimit = rateLimit(10);

export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);
  if (!adminConfigured()) return reply({ error: "Set ADMIN_PASSWORD in .env.local first." }, 503);
  const password = await request
    .json()
    .then((body) => body?.password)
    .catch(() => null);
  if (!checkAdminPassword(password)) {
    if (overLimit(visitor(request))) return reply({ error: "Too many tries. Wait an hour and try again." }, 429);
    return reply({ error: "That password isn't right." }, 401);
  }
  await startAdminSession();
  return reply({ ok: true });
}

export async function DELETE(request) {
  if (!sameOrigin(request)) return reply({ error: "Request not allowed." }, 403);
  await endAdminSession();
  return reply({ ok: true });
}
