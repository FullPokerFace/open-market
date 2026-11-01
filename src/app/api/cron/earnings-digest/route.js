// Vercel Cron (vercel.json): the morning "reporting today" emails at 6 AM New York time.
// Cron schedules are in UTC and New York moves between UTC-4 and UTC-5, so it's scheduled at both 10:00 and
// 11:00 UTC on weekdays and only the run that lands at 6 AM in New York sends.
// Manual run (sends now, any hour): curl -H "Authorization: Bearer $CRON_SECRET" "<site>/api/cron/earnings-digest?force=1"
import { todayInNewYork } from "@/lib/earnings";
import { sendEarningsDigests } from "@/lib/notifications";
import { resendConfigured } from "@/lib/resend";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 300;

const SEND_HOUR = 6;

const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function newYorkHour() {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  // Vercel sends the secret as a bearer token; anyone else is turned away
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return reply({ error: "Unauthorized" }, 401);
  if (!resendConfigured()) return reply({ error: "RESEND_API_KEY and EMAIL_FROM aren't set." }, 503);

  const force = new URL(request.url).searchParams.get("force") === "1";
  const hour = newYorkHour();
  if (!force && hour !== SEND_HOUR) return reply({ skipped: `It's ${hour}:00 in New York; emails go out at ${SEND_HOUR}:00.` });

  try {
    const result = await sendEarningsDigests({ date: todayInNewYork(), siteUrl: process.env.BETTER_AUTH_URL?.trim() || SITE_URL });
    console.log("[notifications] morning emails", result);
    return reply(result, result.failed ? 502 : 200);
  } catch (error) {
    console.error("[notifications] morning emails failed", error);
    return reply({ error: "Sending failed; see the logs." }, 500);
  }
}
