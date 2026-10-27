// Visitor-facing roadmap, written from docs/features.html. Keep the two in step when features
// ship; internal work (caching, hosting, licensing, docs) stays in the doc only.

export const SHIPPED = [
  {
    area: "Calendar",
    items: [
      ["Live earnings calendar", "Every company reporting this month, with EPS and revenue against estimates once results are out."],
      ["Beat, Mixed or Miss", "A colored mark on each reported company: both numbers beat, one did, or neither did."],
      ["Day, week or month", "See one day, one week with every company showing, or the whole month. Step back or ahead, or jump back to today."],
      ["Before open or after close", "Every company is marked by when it reports: before the open, during the day or after the close. The week and day views group them that way, with a marker for where the trading day is now."],
      ["Company filter", "Most popular (the Fortune 100), NYSE, Nasdaq or everything, with counts for the month."],
      ["Watchlists", "Name a watchlist, search and add the companies you follow, and see only them on the calendar. Your last watchlist opens next time you visit."],
      ["Biggest names first", "Each day lists its largest companies first; the rest are one click away in \"+N\"."],
      ["Fits your screen", "The whole month fits in one window, with today framed and in view."],
      ["Company logos", "Logos on the calendar, in search and watchlists, and next to the name in company details. Switch back to tickers any time."],
    ],
  },
  {
    area: "Market",
    items: [
      ["Market sentiment", "The Fear & Greed Index on a five-band meter, with its change since the last close."],
      ["Key releases", "The next Fed decision with the odds of a cut, hold or hike, plus CPI, jobs and GDP dates and expectations."],
      ["Release-day pulse", "A release's card pulses on the day it comes out."],
    ],
  },
  {
    area: "Search & watchlists",
    items: [
      ["Search", "Find any company reporting this month or the next two by ticker or name."],
      ["Watchlists page", "All your watchlists in one place: show one on the calendar, rename it, change its companies or delete it. Add a company from its details panel. Kept in your browser."],
    ],
  },
  {
    area: "Company details",
    items: [
      ["Results at a glance", "EPS and revenue against estimates, with the surprise in percent."],
      ["EPS surprise chart", "How the company did against estimates over the last four quarters."],
      ["SEC filings", "One click to the company's earnings release and all of its filings."],
    ],
  },
  {
    area: "Everything else",
    items: [
      ["Light and dark", "Follows your system setting, or pick one in the header."],
      ["Steady data", "Earnings and market data are saved as they come in, so pages load fast and keep working even when a data source has a hiccup."],
      ["On your phone", "A menu button, a dropdown for the exchange filter, and every view as a day-by-day list with the date pinned as you scroll. Days without earnings fold into one line, and typing never zooms the page. The calendar comes first, with the market panel under it."],
      ["Suggest a feature", "Post an idea from the menu or the roadmap. It's turned into a short card, and an idea that's already there gets your vote instead of a copy."],
      ["Vote on ideas", "Every idea visitors sent, at the top of the roadmap. Vote them up or down, one vote each; the most wanted rise to the top."],
      ["Open source", "The code is on GitHub: anyone can build a feature or fix a bug and send it in."],
    ],
  },
];

// stage: "next" (being worked on), "planned", "later"
export const UPCOMING = [
  { stage: "next", title: "Market-cap filter", text: "Show only large, mid or small companies." },
  { stage: "next", title: "Shareable company links", text: "Send someone a link that opens straight to a company's results." },
  { stage: "planned", title: "US and foreign companies", text: "Filter by where a company is based." },
  { stage: "later", title: "Two years of EPS history", text: "Eight quarters in the surprise chart instead of four." },
  { stage: "later", title: "Insights", text: "A page for a closer look at earnings season. Details to come." },
];

export const STAGES = [
  { key: "next", label: "Next up", swatch: "bg-blue" },
  { key: "planned", label: "Planned", swatch: "bg-mixed" },
  { key: "later", label: "Later", swatch: "bg-muted-foreground" },
];
