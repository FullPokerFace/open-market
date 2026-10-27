import { after } from "next/server";
import { findLogo, logoDevUrl, saveLogo } from "@/lib/logos";

const SYMBOL = /^[A-Z0-9.-]{1,12}$/;
// Saved logos rarely change: browsers keep one a day, the CDN a week and serves the old one while it refreshes,
// so most tile images never reach this function or MongoDB
const SAVED_CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

// A company's logo. Saved in MongoDB: the image (or a cached 404 when logo.dev has none).
// Not saved yet: a redirect to logo.dev's image, so the visitor doesn't wait, while it's saved for next time.
export async function GET(request, ctx) {
  const { symbol } = await ctx.params;
  const ticker = symbol.toUpperCase();
  if (!SYMBOL.test(ticker)) return new Response(null, { status: 400 });

  try {
    const saved = await findLogo(ticker);
    // Not saved, or 30 days old: fetch it again once the response is sent
    if (!saved?.fresh) after(() => saveLogo(ticker));

    if (!saved) {
      // Not cached anywhere, so the next request comes back here and finds the saved copy
      return new Response(null, { status: 307, headers: { Location: logoDevUrl(ticker), "Cache-Control": "no-store" } });
    }
    if (!saved.logo) return new Response(null, { status: 404, headers: { "Cache-Control": SAVED_CACHE } });
    return new Response(saved.logo.bytes, { headers: { "Content-Type": saved.logo.type, "Cache-Control": SAVED_CACHE } });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 502 });
  }
}
