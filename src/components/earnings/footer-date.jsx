"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Read in the browser so the date is the visitor's today, not the build day
function getToday() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function FooterDate() {
  const today = useSyncExternalStore(subscribe, getToday, () => null);
  if (!today) return null;

  return (
    <time dateTime={new Date().toLocaleDateString("en-CA")}>
      © {today.slice(-4)} · {today}
    </time>
  );
}
