// Feature suggestion email, styled like docs/features.html (light theme only: mail clients
// ignore CSS variables and most dark-mode rules, so every style is inline with fixed colors).
import "server-only";
import { SITE_NAME } from "./site";

const C = {
  bg: "#f2f1ee",
  tag: "#e9e8e4",
  tile: "#ffffff",
  ink: "#101014",
  strong: "#000000",
  body: "#4a4a4e",
  muted: "#6b6b6f",
  line: "#d9d8d4",
  blue: "#1a5bc4",
};

const FONT_TEXT = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const FONT_DISPLAY = "'Bricolage Grotesque', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

const hud = `font-family:${FONT_MONO};font-size:11px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:${C.muted};`;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

function formatSent(date) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${label} ET`;
}

// Bordered row of the details table: mono label left, value right
function detailRow(label, value, last = false) {
  const border = last ? "" : `border-bottom:1px solid ${C.line};`;
  return `<tr>
  <th scope="row" align="left" style="${hud}width:34%;padding:12px 16px;${border}border-right:1px solid ${C.line};background:${C.tag};">${label}</th>
  <td style="font-family:${FONT_TEXT};font-size:14px;color:${C.body};padding:12px 16px;${border}">${value}</td>
</tr>`;
}

export function buildSuggestionEmail({ message, sentAt = new Date(), site }) {
  const preview = message.replace(/\s+/g, " ").slice(0, 60);
  const subject = `Feature suggestion: ${preview}${message.length > 60 ? "…" : ""}`;
  const sent = formatSent(sentAt);

  const text = [
    `New feature suggestion from the ${SITE_NAME} site:`,
    "",
    message,
    "",
    `Sent: ${sent}`,
    site && `Site: ${site}`,
    `Length: ${message.length} characters`,
  ]
    .filter((line) => line !== undefined && line !== false && line !== null)
    .join("\n");

  const body = escapeHtml(message).replace(/\r?\n/g, "<br>");
  const siteRow = site
    ? detailRow("Site", `<a href="${escapeHtml(site)}" style="color:${C.blue};">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a>`)
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Geist+Mono:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;border:1px solid ${C.line};background:${C.bg};">

  <tr><td style="padding:10px 24px;border-bottom:1px solid ${C.line};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="${hud}">Feedback / <b style="color:${C.ink};font-weight:500;">Feature suggestion</b></td>
      <td align="right" style="${hud}">${escapeHtml(sent)}</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:32px 24px 24px;border-bottom:1px solid ${C.line};">
    <h1 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-weight:700;font-size:40px;line-height:1.02;letter-spacing:-.04em;color:${C.strong};">New <span style="color:${C.blue};">suggestion</span>.</h1>
    <p style="margin:0;font-family:${FONT_TEXT};font-size:16px;line-height:1.5;color:${C.body};">Someone sent an idea from the <strong style="color:${C.ink};">Suggest a feature</strong> form on ${SITE_NAME}.</p>
  </td></tr>

  <tr><td style="padding:10px 24px;border-bottom:1px solid ${C.line};${hud}">01 / <b style="color:${C.ink};font-weight:500;">Their suggestion</b></td></tr>
  <tr><td style="padding:20px 24px;">
    <div style="background:${C.tile};border:1px solid ${C.line};border-left:4px solid ${C.blue};padding:16px 18px;font-family:${FONT_TEXT};font-size:15px;line-height:1.55;color:${C.ink};word-break:break-word;">${body}</div>
  </td></tr>

  <tr><td style="padding:10px 24px;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};${hud}">02 / <b style="color:${C.ink};font-weight:500;">Details</b></td></tr>
  <tr><td style="padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      ${detailRow("Sent", escapeHtml(sent))}
      ${siteRow}
      ${detailRow("Length", `${message.length} characters`, true)}
    </table>
  </td></tr>

  <tr><td style="padding:14px 24px 18px;border-top:1px solid ${C.line};${hud}">${SITE_NAME} · feature suggestions</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
