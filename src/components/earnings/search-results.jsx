import { CompanyRow } from "./company-row";

const message = "eyebrow m-0 px-6 py-8 text-muted-foreground";

// Drop-down under the header search: companies reporting in the cached months (this month and the next two)
// on any exchange. Exact ticker first, then ticker prefix, then name matches, each by report date.
// While a new search runs (`state` "loading") the previous results stay up.
export function SearchResults({ query, results, state, onSelect }) {
  const count = state === "loading" ? "Searching…" : `${results.length} ${results.length === 1 ? "result" : "results"}`;

  let body;
  if (state === "error") {
    body = <p className={message}>Search is unavailable. Try again.</p>;
  } else if (results.length) {
    body = (
      <ul className="m-0 list-none overflow-y-auto p-0">
        {results.map((e) => (
          <CompanyRow key={`${e.date}|${e.ticker}`} earnings={e} showDate onSelect={onSelect} />
        ))}
      </ul>
    );
  } else {
    body = <p className={message}>{state === "loading" ? "Searching…" : "No companies match."}</p>;
  }

  return (
    <div
      id="search-results"
      className="absolute top-full right-0 z-40 flex max-h-[min(560px,calc(100dvh-60px))] w-[min(560px,100vw)] flex-col border bg-background font-sans text-sm font-normal tracking-normal normal-case shadow-tile"
    >
      <div className="eyebrow flex items-center justify-between gap-3 border-b px-6 py-2.5 text-muted-foreground">
        <span className="truncate">
          Search / <span className="text-foreground">&ldquo;{query}&rdquo;</span>
        </span>
        <span className="shrink-0">
          {count}
        </span>
      </div>
      {body}
    </div>
  );
}
