import { logoDevUrl } from "@/lib/logos";

const SYMBOL = /^[A-Z0-9.-]{1,12}$/;
// The redirect itself rarely changes; once the logo is synced, tiles load /logos/… and stop asking here
const CACHE = "public, max-age=86400, s-maxage=86400";

// Fallback for a logo not in public/logos yet: sends the browser to logo.dev's image, which answers 404
// when it has none, so the tile shows the ticker. Keeps the logo.dev key out of the page itself.
export async function GET(request, ctx) {
  const { symbol } = await ctx.params;
  const ticker = symbol.toUpperCase();
  if (!SYMBOL.test(ticker)) return new Response(null, { status: 400 });

  try {
    return new Response(null, { status: 307, headers: { Location: logoDevUrl(ticker), "Cache-Control": CACHE } });
  } catch (error) {
    console.error(error);
    return new Response(null, { status: 502 });
  }
}
