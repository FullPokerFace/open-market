import { cn } from "@/lib/utils";
import { TickerLabel } from "./company-logo";

const STATUS_TEXT = { Beat: "text-beat", Miss: "text-miss", Mixed: "text-mixed", Reported: "text-muted-foreground" };

// One company in a list: ticker (with its logo in logos mode), optional report date, name, then result or timing
export function CompanyRow({ earnings: e, showDate, dimmed, onSelect }) {
  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => onSelect(e)}
        className={cn(
          "grid w-full cursor-pointer items-center gap-4 px-6 py-3 text-left hover:bg-tag focus-visible:bg-tag focus-visible:outline-none",
          // The ticker column fits a logo and a five-letter ticker
          showDate ? "grid-cols-[88px_52px_minmax(0,1fr)_auto]" : "grid-cols-[96px_minmax(0,1fr)_auto]",
          dimmed && "opacity-40"
        )}
      >
        <TickerLabel ticker={e.ticker} className="tracking-[0.02em]" />
        {showDate && (
          <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
            {e.dateLabel}
          </span>
        )}
        <span className="truncate text-body">{e.name}</span>
        {e.reported ? (
          <span className={cn("chip", STATUS_TEXT[e.status])}>{e.status}</span>
        ) : (
          <span className="chip text-muted-foreground">{e.timing ?? "Upcoming"}</span>
        )}
      </button>
    </li>
  );
}
