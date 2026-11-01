// Emails to signed-in visitors: the sign-in code and the morning "reporting today" email
import "server-only";
import { formatEps, formatRevenue } from "./earnings";
import { blueSpan, C, emailDocument, escapeHtml, FONT_MONO, FONT_TEXT, heading, hud, link, topBar } from "./email-style";
import { SITE_NAME } from "./site";

const footer = (html) => `<tr><td style="padding:14px 24px 18px;border-top:1px solid ${C.line};font-family:${FONT_TEXT};font-size:13px;line-height:1.5;color:${C.muted};">${html}</td></tr>`;

export function buildCodeEmail({ code, minutes }) {
  const subject = `${code} is your ${SITE_NAME} sign-in code`;
  const text = [
    `Your ${SITE_NAME} sign-in code: ${code}`,
    "",
    `It works for ${minutes} minutes. Sign-in is only used for earnings notifications.`,
    "If you didn't ask for this code, ignore this email.",
  ].join("\n");

  const rows = [
    topBar("Account", "Sign in"),
    heading(`Your sign-in ${blueSpan("code")}.`, `Enter it on ${escapeHtml(SITE_NAME)} to turn on earnings notifications.`),
    `<tr><td style="padding:28px 24px;">
      <div style="display:inline-block;background:${C.tile};border:1px solid ${C.line};border-left:4px solid ${C.blue};padding:14px 22px;font-family:${FONT_MONO};font-size:34px;font-weight:700;letter-spacing:.3em;color:${C.strong};">${escapeHtml(code)}</div>
      <p style="margin:16px 0 0;font-family:${FONT_TEXT};font-size:14px;color:${C.body};">It works for ${minutes} minutes.</p>
    </td></tr>`,
    footer(`Sign-in is only used for earnings notifications. If you didn't ask for this code, ignore this email.`),
  ].join("\n");

  return { subject, text, html: emailDocument({ subject, preview: `Your sign-in code is ${code}`, rows }) };
}

// Finnhub's report times; most companies give one, the rest show up under "Time not announced"
const TIMING_GROUPS = [
  { tag: "BMO", title: "Before the open" },
  { tag: "DMH", title: "During market hours" },
  { tag: "AMC", title: "After the close" },
  { tag: null, title: "Time not announced" },
];

// "Monday, Nov 3" for "2026-11-03"
function dayLabel(date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" }).format(
    new Date(`${date}T00:00:00Z`)
  );
}

function subjectFor(tickers) {
  const shown = tickers.slice(0, 4).join(", ");
  return `Reporting today: ${shown}${tickers.length > 4 ? ` +${tickers.length - 4} more` : ""}`;
}

function companyRow(company, last) {
  const border = last ? "" : `border-bottom:1px solid ${C.line};`;
  const estimates = `EPS est. ${formatEps(company.epsEstimate)} · Rev est. ${formatRevenue(company.revenueEstimate)}`;
  return `<tr>
    <td style="padding:12px 16px 12px 24px;${border}width:88px;font-family:${FONT_MONO};font-size:13px;font-weight:700;letter-spacing:.06em;color:${C.strong};">${escapeHtml(company.ticker)}</td>
    <td style="padding:12px 24px 12px 0;${border}font-family:${FONT_TEXT};font-size:14px;color:${C.ink};">${escapeHtml(company.name)}
      <div style="margin-top:2px;font-family:${FONT_MONO};font-size:11px;color:${C.muted};">${escapeHtml(estimates)}</div></td>
  </tr>`;
}

// `companies`: [{ ticker, name, timing ("BMO" | "DMH" | "AMC" | null), epsEstimate, revenueEstimate }];
// `listNames`: the watchlists with notifications on that hold them
// `unsubscribe`: { page, oneClick } from unsubscribeUrls
export function buildDigestEmail({ date, companies, listNames, siteUrl, unsubscribe }) {
  const unsubscribeUrl = unsubscribe.page;
  const tickers = companies.map((c) => c.ticker);
  const subject = subjectFor(tickers);
  const day = dayLabel(date);
  const count = companies.length === 1 ? "1 company" : `${companies.length} companies`;
  const groups = TIMING_GROUPS.map((group) => ({ ...group, companies: companies.filter((c) => c.timing === group.tag) })).filter(
    (group) => group.companies.length
  );
  const lists = listNames.join(", ");
  const calendarUrl = `${siteUrl}/?view=day&date=${date}`;
  const manageUrl = `${siteUrl}/watchlists`;

  const text = [
    `${count} you follow report${companies.length === 1 ? "s" : ""} today, ${day}.`,
    ...groups.flatMap((group) => [
      "",
      `${group.title}:`,
      ...group.companies.map(
        (c) => `  ${c.ticker}  ${c.name}  (EPS est. ${formatEps(c.epsEstimate)}, Rev est. ${formatRevenue(c.revenueEstimate)})`
      ),
    ]),
    "",
    `See them on the calendar: ${calendarUrl}`,
    "",
    `You get this because notifications are on for: ${lists}.`,
    `Manage watchlists: ${manageUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  const sections = groups
    .map(
      (group, i) => `<tr><td style="padding:10px 24px;${i ? `border-top:1px solid ${C.line};` : ""}border-bottom:1px solid ${C.line};${hud}">${String(i + 1).padStart(2, "0")} / <b style="color:${C.ink};font-weight:500;">${escapeHtml(group.title)}</b></td></tr>
  <tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    ${group.companies.map((c, j) => companyRow(c, j === group.companies.length - 1)).join("\n")}
  </table></td></tr>`
    )
    .join("\n");

  const rows = [
    topBar("Earnings", "Today", escapeHtml(day)),
    heading(
      `${escapeHtml(count)} report ${blueSpan("today")}.`,
      `From your watchlists on ${escapeHtml(SITE_NAME)}. Times come from the companies' announcements.`
    ),
    sections,
    `<tr><td style="padding:20px 24px;border-top:1px solid ${C.line};">
      <a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:${C.ink};color:${C.bg};text-decoration:none;padding:12px 18px;font-family:${FONT_MONO};font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">See today's calendar</a>
    </td></tr>`,
    footer(
      `You get this because notifications are on for <strong style="color:${C.ink};">${escapeHtml(lists)}</strong>. ${link(manageUrl, "Manage watchlists")} · ${link(unsubscribeUrl, "Unsubscribe")}`
    ),
  ].join("\n");

  return {
    subject,
    text,
    html: emailDocument({ subject, preview: `${count} from your watchlists report today.`, rows }),
    headers: {
      // One-click unsubscribe from the mail app (RFC 8058), which Gmail and Yahoo require for recurring mail
      "List-Unsubscribe": `<${unsubscribe.oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}
