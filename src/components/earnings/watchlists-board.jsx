"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { todayInNewYork } from "@/lib/earnings";
import { rememberList, useTickerLists } from "@/lib/ticker-lists";
import { cn } from "@/lib/utils";
import { TickerLabel } from "./company-logo";
import { CreateListDialog } from "./create-list-dialog";
import { SectionBar } from "./page-parts";

const button = "flex h-10 cursor-pointer items-center gap-2 px-4.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";
const primary = "bg-foreground text-background";
const secondary = "border border-line-strong text-foreground hover:bg-tag";

const noop = () => () => {};

// The visitor's watchlists (saved in the browser): show one on the calendar, edit, delete, or start a new one
export function WatchlistsBoard() {
  const router = useRouter();
  const { lists, create, update, remove } = useTickerLists();
  // Watchlists only exist in the browser: until hydrated, show neither them nor the empty state
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // The watchlist being edited, or null for a new one
  const [editing, setEditing] = useState(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (list) => {
    setEditing(list);
    setDialogOpen(true);
  };
  const save = (name, tickers) => (editing ? update(editing.id, name, tickers) : create(name, tickers));
  const showOnCalendar = (list) => {
    rememberList(list.tickers);
    router.push("/");
  };
  const confirmRemove = (list) => {
    if (window.confirm(`Delete the watchlist "${list.name}"?`)) remove(list.id);
  };

  let count = "";
  if (hydrated) count = `${lists.length} ${lists.length === 1 ? "watchlist" : "watchlists"}`;

  return (
    <section className="border-b">
      <SectionBar index="01" name="Watchlists" count={count} />
      <div className="flex flex-wrap items-end justify-between gap-4 border-b px-6 pt-7 pb-6">
        <p className="m-0 max-w-190 text-[15px] text-body">
          Pick one to see only its companies on the calendar. Add a company from its details panel, or edit a watchlist
          here. Watchlists are kept in this browser.
        </p>
        <button type="button" onClick={openNew} className={cn(button, primary)}>
          <PlusIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          New watchlist
        </button>
      </div>

      {hydrated && lists.length === 0 && (
        <p className="m-0 px-6 py-10 text-[15px] text-muted-foreground">
          No watchlists yet. Start one with New watchlist, or from a company&apos;s details on the calendar.
        </p>
      )}

      {hydrated && lists.length > 0 && (
        <ul className="m-0 list-none p-0">
          {lists.map((list) => (
            <li key={list.id} className="flex flex-col gap-4 border-b px-6 py-6 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="display-type m-0 min-w-0 text-[28px]">
                  {list.name}{" "}
                  <span className="eyebrow align-middle text-muted-foreground">
                    · {list.tickers.length} {list.tickers.length === 1 ? "company" : "companies"}
                  </span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => showOnCalendar(list)} className={cn(button, primary)}>
                    <CalendarIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    Show on calendar
                  </button>
                  <button type="button" onClick={() => openEdit(list)} aria-label={`Edit ${list.name}`} className={cn(button, secondary)}>
                    <PencilIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmRemove(list)}
                    aria-label={`Delete ${list.name}`}
                    className={cn(button, secondary)}
                  >
                    <Trash2Icon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {list.tickers.map((ticker) => (
                  <li key={ticker} className="border border-line bg-tile px-2.5 py-1.5">
                    <TickerLabel ticker={ticker} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <CreateListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={todayInNewYork().slice(0, 7)}
        list={editing}
        onSave={save}
      />
    </section>
  );
}
