import { cn } from "@/lib/utils";

// Solid report-time icons on a 16px grid: filled shapes stay crisp down to the 10px tile corner,
// where outline icons turn to fuzz. One color for all three, so time reads by shape alone.
export const TIMING_ICON_COLOR = "text-blue";

function Glyph({ className, children }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
      className={cn(TIMING_ICON_COLOR, className)}
    >
      {children}
    </svg>
  );
}

// Sun half over the horizon
export function BeforeOpenIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M3.5 11a4.5 4.5 0 0 1 9 0Z" stroke="none" />
      <path d="M1.5 13.25h13M8 1.75v1.75M2.9 5.4l1.2 1.2M13.1 5.4l-1.2 1.2" fill="none" />
    </Glyph>
  );
}

// Full sun, high in the day
export function DuringHoursIcon({ className }) {
  return (
    <Glyph className={className}>
      <circle cx="8" cy="8" r="3.25" stroke="none" />
      <path
        d="M8 1.25v1.5M8 13.25v1.5M1.25 8h1.5M13.25 8h1.5M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1"
        fill="none"
      />
    </Glyph>
  );
}

// Crescent moon and a star
export function AfterCloseIcon({ className }) {
  return (
    <Glyph className={className}>
      <path d="M7.5 2.25a4.25 4.25 0 0 0 6.25 6.25A6 6 0 1 1 7.5 2.25Z" stroke="none" />
      <path d="M12.5 1 13 2.5l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" stroke="none" />
    </Glyph>
  );
}

// Finnhub timing tag → icon. "During market hours" shares the sun with the week / day middle section.
export const TIMING_ICONS = { BMO: BeforeOpenIcon, DMH: DuringHoursIcon, AMC: AfterCloseIcon };
