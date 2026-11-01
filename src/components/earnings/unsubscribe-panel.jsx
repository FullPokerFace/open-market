"use client";

import { use, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const button = "flex h-10 cursor-pointer items-center gap-2 px-4.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";

// `searchParams` ({ u, t } from the email's link) as the page's promise
export function UnsubscribePanel({ searchParams }) {
  const { u, t } = use(searchParams);
  // idle | working | done | error
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const unsubscribe = async () => {
    setState("working");
    try {
      const res = await fetch(`/api/unsubscribe?u=${encodeURIComponent(u ?? "")}&t=${encodeURIComponent(t ?? "")}`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't unsubscribe. Please try again.");
      setState("done");
    } catch (e) {
      setError(e.message);
      setState("error");
    }
  };

  if (!u || !t) {
    return <p className="m-0 px-6 py-10 text-[15px] text-body">This page needs the Unsubscribe link from one of our emails.</p>;
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-start gap-4 px-6 py-10">
        <p className="m-0 text-[15px] text-body">
          Done. You won&apos;t get earnings emails anymore. Turn them back on for any watchlist on the{" "}
          <Link href="/watchlists" className="text-blue">
            Watchlists
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 px-6 py-10">
      <p className="m-0 max-w-190 text-[15px] text-body">
        Stop the morning emails about companies in your watchlists reporting that day. Your watchlists stay as they are.
      </p>
      <button
        type="button"
        onClick={unsubscribe}
        disabled={state === "working"}
        className={cn(button, "bg-foreground text-background disabled:opacity-60")}
      >
        {state === "working" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
      {state === "error" && (
        <p role="alert" className="m-0 text-[14px] text-miss">
          {error}
        </p>
      )}
    </div>
  );
}
