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
      ["Biggest names first", "Each day lists its largest companies first; the rest are one click away in \"+N\"."],
      ["Fits your screen", "The whole month fits in one window, with today framed and in view."],
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
    area: "Search & watchlist",
    items: [
      ["Search", "Find any company reporting this month or the next two by ticker or name."],
      ["Watchlist", "Save companies and show only them on the calendar. Kept in your browser."],
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
      ["On your phone", "A menu button, a dropdown for the exchange filter, and the day view top to bottom. The calendar comes first, with the market panel under it."],
      ["Suggest a feature", "Send an idea straight to the developer from the menu."],
    ],
  },
];

// stage: "next" (being worked on), "planned", "later"
export const UPCOMING = [
  { stage: "next", title: "Market-cap filter", text: "Show only large, mid or small companies." },
  { stage: "next", title: "Shareable company links", text: "Send someone a link that opens straight to a company's results." },
  { stage: "next", title: "Week and month on phones", text: "A day-by-day list made for small screens." },
  { stage: "planned", title: "US and foreign companies", text: "Filter by where a company is based." },
  { stage: "later", title: "Two years of EPS history", text: "Eight quarters in the surprise chart instead of four." },
  { stage: "later", title: "Company logos", text: "Logos on the calendar tiles instead of tickers." },
  { stage: "later", title: "Insights", text: "A page for a closer look at earnings season. Details to come." },
];

export const STAGES = [
  { key: "next", label: "Next up", swatch: "bg-blue" },
  { key: "planned", label: "Planned", swatch: "bg-mixed" },
  { key: "later", label: "Later", swatch: "bg-muted-foreground" },
];
