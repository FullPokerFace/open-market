"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon, PlusIcon } from "lucide-react";

const LIST_VALUE = "list:";
const OTHER_LIST = "other-list";

// `children` (the calendar toolbar) sits at the right end of the row, and still shows without filters.
// One dropdown with the exchanges, then the visitor's own lists, and "+ Create list" beside it.
// `showingList`: the calendar is filtered to a list's tickers (`activeListId` is null when no saved list matches).
export function ExchangeFilter({ filters, lists, activeListId, showingList, onSelectList, onSelectExchange, onNewList, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-2">
      {filters.length > 0 && (
        <nav aria-label="Filter companies" className="flex flex-wrap items-center ">
          <ExchangeSelect
            filters={filters}
            lists={lists}
            activeListId={activeListId}
            showingList={showingList}
            onSelectList={onSelectList}
            onSelectExchange={onSelectExchange}
          />
          <NewListButton onClick={onNewList} />
        </nav>
      )}
      {children}
    </div>
  );
}

function NewListButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create list"
      className="flex h-10 w-10 cursor-pointer items-center justify-center gap-2 border border-line-strong font-mono text-[11px] font-bold tracking-[0.12em] text-foreground uppercase hover:bg-tag sm:w-auto sm:px-4"
    >
      <PlusIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
      {/* Icon only on phones */}
      <span className="hidden sm:inline">Create list</span>
    </button>
  );
}

// Native select so phones get their own picker; choosing an exchange navigates to its filtered calendar
function ExchangeSelect({ filters, lists, activeListId, showingList, onSelectList, onSelectExchange }) {
  const router = useRouter();
  const active = filters.find((filter) => filter.active) ?? filters[0];
  let value = active.key;
  if (activeListId) value = `${LIST_VALUE}${activeListId}`;
  // A list link whose saved list is gone (deleted, or opened in another browser)
  else if (showingList) value = OTHER_LIST;

  const onChange = (next) => {
    if (next.startsWith(LIST_VALUE)) return onSelectList(next.slice(LIST_VALUE.length));
    onSelectExchange();
    router.push(filters.find((filter) => filter.key === next).href, { scroll: false });
  };

  return (
    <label className="relative flex">
      <span className="sr-only">Exchange or list</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 max-w-56 cursor-pointer appearance-none truncate border border-line-strong bg-background pr-10 pl-4 font-mono text-[11px] font-bold tracking-[0.12em] text-foreground uppercase"
      >
        {filters.map((filter) => (
          <option key={filter.key} value={filter.key}>
            {filter.label} · {filter.count}
          </option>
        ))}
        {value === OTHER_LIST && (
          <option value={OTHER_LIST} disabled>
            Ticker list
          </option>
        )}
        {lists.length > 0 && (
          <optgroup label="My lists">
            {lists.map((list) => (
              <option key={list.id} value={`${LIST_VALUE}${list.id}`}>
                {list.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2 text-foreground"
        strokeWidth={2.2}
        aria-hidden="true"
      />
    </label>
  );
}
