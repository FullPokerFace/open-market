// Server-only: the admin panel's sign-in and the user list it shows.
// The admin signs in on /admin/login with ADMIN_PASSWORD, separate from visitors' Better Auth sign-in. The session is
// a random token in an httpOnly cookie, stored as its SHA-256 in `adminSessions` so a database leak can't be replayed.
// adminSessions: { _id: sha256(token), createdAt, expiresAt }
import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ObjectId } from "mongodb";
import { COLLECTIONS, DAY, getDb } from "./db";

const ADMIN_COOKIE = "om_admin";
const ADMIN_SESSION_DAYS = 7;

const hash = (value) => createHash("sha256").update(value).digest("hex");

let indexed = null;
async function adminSessions() {
  const sessions = (await getDb()).collection(COLLECTIONS.adminSessions);
  indexed ??= sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((error) => {
    indexed = null;
    console.error("[db] adminSessions index", error);
  });
  await indexed;
  return sessions;
}

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

// Compares hashes so the check takes the same time whatever was typed
export function checkAdminPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string" || !input) return false;
  return timingSafeEqual(Buffer.from(hash(input), "hex"), Buffer.from(hash(expected), "hex"));
}

// Starts an admin session and sets its cookie; call from a route handler
export async function startAdminSession() {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await (await adminSessions()).insertOne({
    _id: hash(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + ADMIN_SESSION_DAYS * DAY),
  });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function endAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token) await (await adminSessions()).deleteOne({ _id: hash(token) });
  cookieStore.delete(ADMIN_COOKIE);
}

// Is this request from the signed-in admin? Once per request. connection() keeps `new Date()` out of the prerender.
export const isAdmin = cache(async () => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  await connection();
  const session = await (await adminSessions()).findOne({ _id: hash(token), expiresAt: { $gt: new Date() } });
  return Boolean(session);
});

// For admin pages: off to /admin/login unless signed in as admin
export async function requireAdmin(returnTo = "/admin") {
  if (!(await isAdmin())) redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
}

// Only paths on this site, so ?next= can't send anyone elsewhere
export const safeNext = (next) => (typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : "/");

// One page of accounts, newest first; `query` matches part of the email, any case.
// Each user: { id, email, name, emailVerified, createdAt, lastSeenAt, lists, tickers, notify }.
// lastSeenAt is their most recent session's last refresh (Better Auth refreshes it once a day while they visit).
export async function listUsers({ query = "", page = 1, perPage = 50 } = {}) {
  const db = await getDb();
  const users = db.collection(COLLECTIONS.users);
  const filter = query ? { email: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {};
  const [docs, total] = await Promise.all([
    users.find(filter, { sort: { createdAt: -1 }, skip: (page - 1) * perPage, limit: perPage }).toArray(),
    users.countDocuments(filter),
  ]);

  const ids = docs.map((doc) => doc._id.toString());
  // Better Auth stores session.userId as an ObjectId; strings too, in case an adapter setting ever changes that
  const userIdValues = [...ids, ...ids.filter(ObjectId.isValid).map((id) => new ObjectId(id))];
  const [sessions, watchlists] = await Promise.all([
    db
      .collection(COLLECTIONS.sessions)
      .aggregate([
        { $match: { userId: { $in: userIdValues } } },
        { $group: { _id: "$userId", lastSeenAt: { $max: { $ifNull: ["$updatedAt", "$createdAt"] } } } },
      ])
      .toArray(),
    db.collection(COLLECTIONS.watchlists).find({ _id: { $in: ids } }, { projection: { lists: 1 } }).toArray(),
  ]);
  const lastSeen = new Map(sessions.map((row) => [row._id.toString(), row.lastSeenAt]));
  const lists = new Map(watchlists.map((doc) => [doc._id.toString(), doc.lists ?? []]));

  return {
    total,
    users: docs.map((doc) => {
      const id = doc._id.toString();
      const userLists = lists.get(id) ?? [];
      return {
        id,
        email: doc.email,
        name: doc.name || null,
        emailVerified: Boolean(doc.emailVerified),
        createdAt: doc.createdAt?.toISOString() ?? null,
        lastSeenAt: lastSeen.get(id)?.toISOString() ?? null,
        lists: userLists.length,
        tickers: new Set(userLists.flatMap((list) => list.tickers ?? [])).size,
        notify: userLists.some((list) => list.notify),
      };
    }),
  };
}
