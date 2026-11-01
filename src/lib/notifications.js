// Server-only: the 6 AM ET "reporting today" emails. One email per person a day, listing every company from
// their watchlists with notifications on that reports that day, however many lists it's in.
import "server-only";
import { randomUUID } from "node:crypto";
import { getCompanyDirectory } from "./companies";
import { COLLECTIONS, getDb } from "./db";
import { tidyCompanyName } from "./earnings";
import { fetchEarningsDay } from "./finnhub";
import { buildDigestEmail } from "./notification-email";
import { BATCH_LIMIT, sendBatch } from "./resend";
import { unsubscribeUrls } from "./watchlists";

const TIMING_TAGS = { bmo: "BMO", dmh: "DMH", amc: "AMC" };

// Batches still marked "sending" after this long crashed mid-send; they're released so a rerun can retry them
const STALE_CLAIM_MS = 15 * 60 * 1000;

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// [{ userId, email, tickers, listNames }] for everyone with a notify-on list holding a company reporting today
function recipients(docs, reporting) {
  return docs.flatMap((doc) => {
    const lists = (doc.lists ?? []).filter((list) => list.notify && list.tickers.some((t) => reporting.has(t)));
    const tickers = [...new Set(lists.flatMap((list) => list.tickers.filter((t) => reporting.has(t))))];
    if (!doc.email || !tickers.length) return [];
    return [{ userId: doc._id, email: doc.email, tickers, listNames: lists.map((list) => list.name) }];
  });
}

// Sends `date`'s emails (an ISO date in New York). Safe to run again: anyone already sent to, or being sent to
// by another run, is skipped. Returns counts for the cron log.
export async function sendEarningsDigests({ date, siteUrl }) {
  const rows = await fetchEarningsDay(date);
  const reporting = new Map(rows.filter((row) => row.date === date).map((row) => [row.symbol, row]));
  if (!reporting.size) return { date, reporting: 0, recipients: 0, sent: 0 };

  const db = await getDb();
  const watchlists = db.collection(COLLECTIONS.watchlists);
  const log = db.collection(COLLECTIONS.notificationLog);

  const docs = await watchlists
    .find(
      { lists: { $elemMatch: { notify: true, tickers: { $in: [...reporting.keys()] } } } },
      { projection: { email: 1, lists: 1 } }
    )
    .toArray();
  const everyone = recipients(docs, reporting);
  if (!everyone.length) return { date, reporting: reporting.size, recipients: 0, sent: 0 };

  await log.deleteMany({ date, status: "sending", claimedAt: { $lt: new Date(Date.now() - STALE_CLAIM_MS) } });

  const directory = await getCompanyDirectory([...new Set(everyone.flatMap((r) => r.tickers))]).catch((error) => {
    console.error("[notifications] company names unavailable, using tickers", error);
    return {};
  });
  const company = (ticker) => {
    const row = reporting.get(ticker);
    const name = directory[ticker]?.name;
    return {
      ticker,
      name: name ? tidyCompanyName(name) : ticker,
      timing: TIMING_TAGS[row.hour] ?? null,
      epsEstimate: row.epsEstimate ?? null,
      revenueEstimate: row.revenueEstimate ?? null,
    };
  };

  const run = randomUUID();
  let sent = 0;
  let failed = 0;
  for (const batch of chunk(everyone, BATCH_LIMIT)) {
    // Claim each recipient for the day first: the log's _id is unique, so a second run can't claim them again
    const claims = batch.map((r) => ({
      _id: `${date}:${r.userId}`,
      userId: r.userId,
      date,
      tickers: r.tickers,
      status: "sending",
      run,
      claimedAt: new Date(),
    }));
    try {
      await log.insertMany(claims, { ordered: false });
    } catch (error) {
      // Duplicate keys are people already sent (or being sent) today; anything else is a real failure
      const writeErrors = error.writeErrors ? [error.writeErrors].flat() : [];
      if (!writeErrors.length || writeErrors.some((e) => e.code !== 11000)) throw error;
    }
    const claimed = new Set(
      (await log.find({ _id: { $in: claims.map((c) => c._id) }, run }, { projection: { userId: 1 } }).toArray()).map((c) => c.userId)
    );
    const mine = batch.filter((r) => claimed.has(r.userId));
    if (!mine.length) continue;

    const messages = mine.map((r) => ({
      to: r.email,
      ...buildDigestEmail({
        date,
        companies: r.tickers.map(company),
        listNames: r.listNames,
        siteUrl,
        unsubscribe: unsubscribeUrls(siteUrl, r.userId),
      }),
    }));
    const ids = mine.map((r) => `${date}:${r.userId}`);
    try {
      // Resend drops a repeat of the same key within 24 hours, a second guard against sending twice
      await sendBatch(messages, { idempotencyKey: `digest-${date}-${mine[0].userId}-${mine.length}` });
      await log.updateMany({ _id: { $in: ids } }, { $set: { status: "sent", sentAt: new Date() } });
      sent += mine.length;
    } catch (error) {
      // Release the claims so the next run tries these people again
      console.error(`[notifications] sending ${mine.length} emails failed`, error);
      await log.deleteMany({ _id: { $in: ids }, status: "sending" });
      failed += mine.length;
    }
  }

  return { date, reporting: reporting.size, recipients: everyone.length, sent, failed };
}
