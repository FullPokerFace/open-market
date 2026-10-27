// Company logos live in public/logos (/logos/logo-AAPL.png), committed and served by the CDN; tickers logo.dev
// has no logo for are listed in logo-missing.json. `npm run logos:sync` adds the ones not there yet.
// Until then a tile falls back to /api/logo/[symbol], which sends the browser to logo.dev's image.
// No "@/" imports: the scripts in scripts/ run this file with plain Node.

// File name in public/logos. The prefix matters: Windows can't create files named after devices
// (CON.png, AUX.png, NUL.png…), and CON is a real ticker.
export const logoFileName = (ticker) => `logo-${ticker}.png`;

// The logo image on logo.dev's CDN. Its token is a publishable key, made to be seen by browsers.
export function logoDevUrl(symbol) {
  const token = process.env.LOGO_DEV_TOKEN;
  if (!token) throw new Error("LOGO_DEV_TOKEN is not set in .env.local");
  const params = new URLSearchParams({ token, size: "64", format: "png", retina: "true", fallback: "404" });
  return `https://img.logo.dev/ticker/${encodeURIComponent(symbol)}?${params}`;
}
