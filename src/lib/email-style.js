// Shared look for every email the site sends, styled like docs/features.html (light theme only: mail clients
// ignore CSS variables and most dark-mode rules, so every style is inline with fixed colors).
import "server-only";

export const C = {
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

export const FONT_TEXT = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const FONT_MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
export const FONT_DISPLAY = "'Bricolage Grotesque', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export const hud = `font-family:${FONT_MONO};font-size:11px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:${C.muted};`;

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

// The full document around `rows` (<tr> rows of the 640px card); `preview` is the inbox snippet
export function emailDocument({ subject, preview, rows }) {
  return `<!doctype html>
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
${rows}
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Top bar: "Section / <b>Page</b>" left, `right` (already escaped) on the right
export function topBar(section, page, right = "") {
  return `<tr><td style="padding:10px 24px;border-bottom:1px solid ${C.line};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="${hud}">${escapeHtml(section)} / <b style="color:${C.ink};font-weight:500;">${escapeHtml(page)}</b></td>
      <td align="right" style="${hud}">${right}</td>
    </tr></table>
  </td></tr>`;
}

// Big title (`titleHtml` may hold a blue <span>) and an intro paragraph (already escaped HTML)
export function heading(titleHtml, introHtml) {
  return `<tr><td style="padding:32px 24px 24px;border-bottom:1px solid ${C.line};">
    <h1 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-weight:700;font-size:40px;line-height:1.02;letter-spacing:-.04em;color:${C.strong};">${titleHtml}</h1>
    <p style="margin:0;font-family:${FONT_TEXT};font-size:16px;line-height:1.5;color:${C.body};">${introHtml}</p>
  </td></tr>`;
}

export const blueSpan = (text) => `<span style="color:${C.blue};">${escapeHtml(text)}</span>`;
export const link = (href, text) => `<a href="${escapeHtml(href)}" style="color:${C.blue};">${escapeHtml(text)}</a>`;
