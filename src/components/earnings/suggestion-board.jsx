"use client";

import { useEffect, useState } from "react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { DEFAULT_SUGGESTION_ICON, SUGGESTION_ICONS } from "@/lib/suggestion-icons";
import { cn } from "@/lib/utils";

// Every board on the page (the roadmap's and the dialog's) listens for this, so a new card or vote shows in both
const CHANGED = "suggestions:changed";
export const announceSuggestion = (suggestion) => window.dispatchEvent(new CustomEvent(CHANGED, { detail: suggestion }));

const upsert = (list, card) =>
  list.some((s) => s.id === card.id) ? list.map((s) => (s.id === card.id ? card : s)) : [card, ...list];

// The board from /api/suggestions, most votes first. Order is kept while the visitor votes,
// so cards don't jump out from under the cursor; it's re-sorted on the next load.
function useSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  // loading | ready | error
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/suggestions")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Couldn't load suggestions.");
        if (!active) return;
        setSuggestions(data.suggestions);
        setState("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setState("error");
      });
    const onChanged = (event) => setSuggestions((list) => upsert(list, event.detail));
    window.addEventListener(CHANGED, onChanged);
    return () => {
      active = false;
      window.removeEventListener(CHANGED, onChanged);
    };
  }, []);

  // Clicking the vote you already gave takes it back
  const vote = async (card, direction) => {
    const value = card.myVote === direction ? 0 : direction;
    setError("");
    setSuggestions((list) => upsert(list, { ...card, myVote: value, score: card.score - card.myVote + value }));
    try {
      const res = await fetch(`/api/suggestions/${card.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save your vote. Please try again.");
      announceSuggestion(data.suggestion);
    } catch (err) {
      setSuggestions((list) => upsert(list, card));
      setError(err.message);
    }
  };

  return { suggestions, state, error, vote };
}

// "12 ideas · 2 done · by votes"
function boardCount(suggestions) {
  const done = suggestions.filter((s) => s.done).length;
  return `${suggestions.length} ${suggestions.length === 1 ? "idea" : "ideas"}${done ? ` · ${done} done` : ""} · by votes`;
}

// 3 columns by 2 rows on wide screens (fewer columns on narrow ones), scrolling for the rest.
// `highlightId`: the card the visitor just posted or added to.
export function SuggestionBoard({ highlightId, className }) {
  const { suggestions, state, error, vote } = useSuggestions();

  return (
    <div className={className}>
      <div className="eyebrow flex flex-wrap justify-between gap-2 border-b px-6 py-2.5 text-muted-foreground">
        <span>
          Board / <span className="text-foreground">Most popular user submissions</span>
        </span>
        <span>{state === "ready" ? boardCount(suggestions) : ""}</span>
      </div>

      {state === "loading" && <p className="m-0 px-6 py-6 text-[14px] text-muted-foreground">Loading suggestions…</p>}
      {state === "ready" && !suggestions.length && (
        <p className="m-0 px-6 py-6 text-[14px] text-body">No suggestions yet. Be the first.</p>
      )}
      {state === "ready" && suggestions.length > 0 && (
        <ul className="m-0 grid max-h-71.75 list-none auto-rows-36 grid-cols-1 overflow-y-auto overscroll-contain p-0 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((card) => (
            <SuggestionCard key={card.id} card={card} highlighted={card.id === highlightId} onVote={vote} />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="m-0 border-t px-6 py-3 text-[13px] text-miss">
          {error}
        </p>
      )}
    </div>
  );
}

// A done card (the feature shipped) says so and swaps its vote buttons for a check: it takes no more votes
function SuggestionCard({ card, highlighted, onVote }) {
  const Icon = SUGGESTION_ICONS[card.icon] ?? SUGGESTION_ICONS[DEFAULT_SUGGESTION_ICON];
  return (
    <li className={cn("-mt-px -ml-px flex min-w-0 border-t border-l", highlighted && "bg-tile")}>
      <div className="flex min-w-0 flex-1 flex-col px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-blue" strokeWidth={2} aria-hidden="true" />
          <span className="truncate text-[15px] font-semibold text-strong" title={card.title}>
            {card.title}
          </span>
        </div>
        <p className="m-0 mt-1.5 line-clamp-3 text-[13px] text-body">{card.description}</p>
        <span className="eyebrow mt-auto flex items-center gap-2 pt-2 text-[10px] text-muted-foreground">
          {card.done && <span className="chip text-beat">Done</span>}
          <span>
            {highlighted ? "Yours · " : ""}
            {card.requests} {card.requests === 1 ? "request" : "requests"}
          </span>
        </span>
      </div>
      <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-0.5 border-l">
        {card.done ? (
          <>
            <CheckIcon className="size-4.5 text-beat" strokeWidth={2.4} aria-label="Done" />
            <span className="font-mono text-[13px] font-bold text-muted-foreground" aria-label={`Final score ${card.score}`}>
              {card.score}
            </span>
          </>
        ) : (
          <>
            <VoteButton direction={1} card={card} onVote={onVote} />
            <span className="font-mono text-[13px] font-bold text-foreground" aria-label={`Score ${card.score}`}>
              {card.score}
            </span>
            <VoteButton direction={-1} card={card} onVote={onVote} />
          </>
        )}
      </div>
    </li>
  );
}

function VoteButton({ direction, card, onVote }) {
  const up = direction === 1;
  const active = card.myVote === direction;
  const Icon = up ? ChevronUpIcon : ChevronDownIcon;
  return (
    <button
      type="button"
      onClick={() => onVote(card, direction)}
      aria-pressed={active}
      aria-label={`${up ? "Upvote" : "Downvote"} ${card.title}`}
      className={cn(
        "grid size-8 cursor-pointer place-items-center text-muted-foreground hover:text-foreground",
        active && (up ? "text-beat hover:text-beat" : "text-miss hover:text-miss")
      )}
    >
      <Icon className="size-4.5" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}
