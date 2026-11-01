// Server-only: a signed-in visitor's watchlists, one document per user:
// { _id: userId, email, lists: [{ id, name, tickers, notify }], updatedAt }.
// The email is kept here so the morning job doesn't have to look users up one by one.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { COLLECTIONS, getDb } from "./db";
import { cleanLists } from "./watchlist-rules";

async function collection() {
  return (await getDb()).collection(COLLECTIONS.watchlists);
}

export async function getWatchlists(userId) {
  const doc = await (await collection()).findOne({ _id: userId }, { projection: { lists: 1 } });
  return cleanLists(doc?.lists);
}

// Replaces the user's lists with `lists` (cleaned to the limits); returns what was saved
export async function saveWatchlists({ id, email }, lists) {
  const clean = cleanLists(lists);
  await (await collection()).updateOne(
    { _id: id },
    { $set: { email, lists: clean, updatedAt: new Date() } },
    { upsert: true }
  );
  return clean;
}

// Notifications off on every list (unsubscribe link); false when the user has no saved lists
export async function turnOffNotifications(userId) {
  const result = await (await collection()).updateOne(
    { _id: userId },
    { $set: { "lists.$[].notify": false, updatedAt: new Date() } }
  );
  return result.matchedCount > 0;
}

// Everything the app saved for the user (account deletion); the sign-in records are removed by deleteAuthUser
export async function deleteWatchlistData(userId) {
  const db = await getDb();
  await Promise.all([
    db.collection(COLLECTIONS.watchlists).deleteOne({ _id: userId }),
    db.collection(COLLECTIONS.notificationLog).deleteMany({ userId }),
  ]);
}

// Unsubscribe links carry the user id and this signature, so they work without signing in and can't be guessed
function sign(userId) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`unsubscribe:${userId}`).digest("base64url");
}

// `page`: the link in the email, a page with a button (a GET never unsubscribes, since mail scanners open links);
// `oneClick`: what the mail app's own Unsubscribe button POSTs to
export function unsubscribeUrls(siteUrl, userId) {
  const query = `u=${encodeURIComponent(userId)}&t=${sign(userId)}`;
  return { page: `${siteUrl}/unsubscribe?${query}`, oneClick: `${siteUrl}/api/unsubscribe?${query}` };
}

export function validUnsubscribe(userId, token) {
  if (typeof userId !== "string" || typeof token !== "string" || !userId || !token) return false;
  const expected = Buffer.from(sign(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
