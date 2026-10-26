"use client";

import { useRef, useState } from "react";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LIST_NAME_MAX } from "@/lib/ticker-lists";
import { useCompanySearch } from "./use-company-search";

const actionButton = "h-10 px-4.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";
const field = "h-10 w-full min-w-0 border border-line-strong bg-tile px-3 text-[14px] text-foreground outline-none focus-visible:border-ring";
const message = "eyebrow m-0 px-4 py-4 text-muted-foreground";

// Name a list, then search -> add, search -> add, then create it.
// `onCreate(name, tickers)` saves it; the draft is kept if the dialog is closed without creating.
export function CreateListDialog({ open, onOpenChange, month, onCreate }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  // [{ ticker, name }] in the order they were added
  const [companies, setCompanies] = useState([]);
  const searchInput = useRef(null);

  const q = query.trim().toUpperCase();
  const search = useCompanySearch(q, month);
  // A company can report more than once in the months searched: one row each
  const results = [...new Map(search.results.map((e) => [e.ticker, e])).values()];
  const added = new Set(companies.map((c) => c.ticker));

  const add = (e) => {
    if (!added.has(e.ticker)) setCompanies((list) => [...list, { ticker: e.ticker, name: e.name }]);
    setQuery("");
    searchInput.current?.focus();
  };
  const remove = (ticker) => setCompanies((list) => list.filter((c) => c.ticker !== ticker));

  const onSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;
    // Enter adds the top result instead of submitting the form
    event.preventDefault();
    if (search.state === "ready" && results.length) add(results[0]);
  };

  const ready = name.trim().length > 0 && companies.length > 0;
  const submit = (event) => {
    event.preventDefault();
    if (!ready) return;
    onCreate(name, companies.map((c) => c.ticker));
    setName("");
    setQuery("");
    setCompanies([]);
    onOpenChange(false);
  };

  let resultsBody = null;
  if (q) {
    if (search.state === "error") {
      resultsBody = <p className={message}>Search is unavailable. Try again.</p>;
    } else if (results.length) {
      resultsBody = (
        <ul className="m-0 max-h-56 list-none overflow-y-auto p-0">
          {results.map((e) => {
            const inList = added.has(e.ticker);
            return (
              <li key={e.ticker} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => add(e)}
                  disabled={inList}
                  className="grid w-full cursor-pointer grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-tag focus-visible:bg-tag focus-visible:outline-none disabled:cursor-default disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span className="font-mono text-xs font-bold text-strong">{e.ticker}</span>
                  <span className="truncate text-body">{e.name}</span>
                  <span className="chip text-muted-foreground">
                    {inList ? (
                      "Added"
                    ) : (
                      <>
                        <PlusIcon className="size-2.75" strokeWidth={2.5} aria-hidden="true" />
                        Add
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      );
    } else {
      resultsBody = <p className={message}>{search.state === "loading" ? "Searching…" : "No companies match."}</p>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background">
        <div className="eyebrow flex shrink-0 items-center justify-between border-b pl-6 text-muted-foreground">
          <span>
            Lists / <span className="text-foreground">New list</span>
          </span>
          <DialogClose aria-label="Close" className="grid h-11 w-12 cursor-pointer place-items-center border-l text-foreground">
            <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="display-type text-[28px] font-bold">
            New ticker <span className="text-blue">list</span>.
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-body">
            Name it, then search and add companies reporting this month or the next two.
          </DialogDescription>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-col gap-5 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="list-name" className="eyebrow text-muted-foreground">
                List name
              </Label>
              <span className="eyebrow text-[10px] text-muted-foreground">
                {name.length} / {LIST_NAME_MAX}
              </span>
            </div>
            <input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={LIST_NAME_MAX}
              placeholder="e.g. Chips"
              autoComplete="off"
              className={field}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="list-search" className="eyebrow text-muted-foreground">
              Add companies
            </Label>
            <div className="border border-line-strong bg-tile">
              <label className="flex h-10 items-center gap-2 px-3">
                <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.2} aria-hidden="true" />
                <input
                  id="list-search"
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="SEARCH TICKER OR COMPANY"
                  autoComplete="off"
                  className="eyebrow w-full min-w-0 border-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
              {resultsBody && <div className="border-t bg-background">{resultsBody}</div>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="eyebrow text-muted-foreground">
              In this list · {companies.length}
            </span>
            {companies.length ? (
              <ul className="m-0 list-none border p-0">
                {companies.map((c) => (
                  <li
                    key={c.ticker}
                    className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b pl-4 last:border-b-0"
                  >
                    <span className="font-mono text-xs font-bold text-strong">{c.ticker}</span>
                    <span className="truncate text-body">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => remove(c.ticker)}
                      aria-label={`Remove ${c.ticker}`}
                      className="grid size-10 cursor-pointer place-items-center border-l text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 border border-dashed px-4 py-4 text-[13px] text-muted-foreground">
                Nothing yet. Search above and pick a company to add it.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!ready} className={actionButton}>
              Create list
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
