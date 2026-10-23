import { formatPercent } from "@/lib/earnings";
import { cn } from "@/lib/utils";

const MAX_BAR = 42;

export function EpsSurpriseChart({ history }) {
  const max = Math.max(...history.map((q) => Math.abs(q.value))) || 1;
  const label = `EPS surprise by quarter: ${history.map((q) => `${q.quarter} ${formatPercent(q.value)}`).join(", ")}`;

  return (
    <div
      role="img"
      aria-label={label}
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))` }}
    >
      {history.map(({ quarter, value }) => {
        const height = Math.max(2, Math.round((Math.abs(value) / max) * MAX_BAR));
        const positive = value >= 0;
        const color = positive ? "bg-beat" : "bg-miss";
        return (
          <div key={quarter} className="flex flex-col items-center" aria-hidden="true">
            <span className={cn("h-4 font-mono text-[10px] font-semibold", positive ? "text-beat" : "text-miss")}>
              {formatPercent(value).slice(0, -1)}
            </span>
            <div className="flex h-11 w-full items-end justify-center">
              {positive && <div className={cn("w-3.5", color)} style={{ height }} />}
            </div>
            <div className="h-px w-full bg-foreground" />
            <div className="flex h-11 w-full items-start justify-center">
              {!positive && <div className={cn("w-3.5", color)} style={{ height }} />}
            </div>
            <span className="mt-1.5 font-mono text-[10px] text-muted-foreground">{quarter}</span>
          </div>
        );
      })}
    </div>
  );
}
