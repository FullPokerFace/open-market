"use client";

import { useEffect, useState } from "react";

// Wait for a pause in typing before searching
const SEARCH_DELAY_MS = 150;

// Company search through /api/search: every exchange, this month and the next two plus `month`.
// `query` is already trimmed and uppercased. Until a new answer arrives, the last one stays up.
export function useCompanySearch(query, month) {
  const [search, setSearch] = useState({ key: "", state: "ready", results: [] });
  const key = query ? `${month}|${query}` : "";

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?${new URLSearchParams({ month, q: query })}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => setSearch({ key, state: "ready", results: data.results }))
        .catch((error) => {
          if (error.name !== "AbortError") setSearch({ key, state: "error", results: [] });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, month, query]);

  return { state: search.key === key ? search.state : "loading", results: search.results };
}
