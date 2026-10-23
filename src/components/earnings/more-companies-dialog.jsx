"use client";

import { XIcon } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CompanyRow } from "./company-row";

export function MoreCompaniesDialog({ day, list, open, onOpenChange, filtering, isMatch, onSelect }) {
  let body;
  let matchCount = null;
  if (!list || list.state === "loading") {
    body = <p className="eyebrow m-0 px-6 py-8 text-muted-foreground">Loading companies…</p>;
  } else if (list.state === "error") {
    body = <p className="eyebrow m-0 px-6 py-8 text-muted-foreground">Could not load companies. Try again.</p>;
  } else {
    // While searching or on the watchlist, matches move to the top (still largest first)
    const matches = filtering ? list.earnings.filter(isMatch) : list.earnings;
    const rest = filtering ? list.earnings.filter((e) => !isMatch(e)) : [];
    if (filtering) matchCount = matches.length;
    body = (
      <ul className="m-0 list-none overflow-y-auto p-0">
        {[...matches, ...rest].map((e) => (
          <CompanyRow key={e.ticker} earnings={e} dimmed={!isMatch(e)} onSelect={onSelect} />
        ))}
      </ul>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background">
        {day && (
          <>
            <div className="eyebrow flex items-center justify-between border-b pl-6 text-muted-foreground">
              <span>
                {day.longLabel} / <span className="text-foreground">{day.hidden} more companies</span>
              </span>
              <DialogClose
                aria-label="Close"
                className="grid h-11 w-12 cursor-pointer place-items-center border-l text-foreground"
              >
                <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
              </DialogClose>
            </div>
            <div className="border-b px-6 py-4">
              <DialogTitle className="display-type text-[28px] font-bold">
                {day.longLabel} <span className="text-blue">reporters</span>.
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] text-body">
                Smaller companies not shown on the calendar, largest first
                {matchCount === 0 && "; none match your filter"}
                {matchCount > 0 && `; ${matchCount} ${matchCount === 1 ? "match" : "matches"} listed first`}.
                Pick one to see results.
              </DialogDescription>
            </div>
            {body}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
