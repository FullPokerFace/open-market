const ITEMS = [
  { label: "Beat", text: "text-beat", swatch: "bg-beat" },
  { label: "Mixed", text: "text-mixed", swatch: "bg-mixed" },
  { label: "Miss", text: "text-miss", swatch: "bg-miss" },
];

export function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 font-mono text-[10px] font-medium tracking-[0.1em] uppercase">
      <div className="flex flex-wrap items-center gap-1.5">
        LEGEND:
        {ITEMS.map(({ label, text, swatch }) => (
          <span key={label} className={`chip ${text}`}>
            <span className={`size-1.75 ${swatch}`} aria-hidden="true" />
            {label}
          </span>
        ))}
        <span className="chip text-muted-foreground">No mark · upcoming</span>
      </div>
      <span className="text-muted-foreground">Data · Finnhub</span>
    </div>
  );
}
