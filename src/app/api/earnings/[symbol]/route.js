import { getCompanyProfile, getEpsHistory } from "@/lib/finnhub";

const SYMBOL = /^[A-Z0-9.-]{1,12}$/;

// Company profile + EPS surprise history for the details panel
export async function GET(request, ctx) {
  const { symbol } = await ctx.params;
  const ticker = symbol.toUpperCase();
  if (!SYMBOL.test(ticker)) {
    return Response.json({ error: "Invalid symbol" }, { status: 400 });
  }

  try {
    const [profile, history] = await Promise.all([getCompanyProfile(ticker), getEpsHistory(ticker)]);
    return Response.json({ profile, history });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load company details" }, { status: 502 });
  }
}
