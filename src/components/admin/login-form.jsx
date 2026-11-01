"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonClass } from "./parts";

// /admin/login: the ADMIN_PASSWORD, then on to `next`
export function AdminLoginForm({ next }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ state: "working", message: "" });
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) return setStatus({ state: "error", message: data?.error || "Couldn't sign in." });
    router.replace(next);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-3 px-6 py-6">
      <label htmlFor="admin-password" className="eyebrow text-muted-foreground">
        Admin password
      </label>
      <div className="flex">
        <input
          id="admin-password"
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="h-10 min-w-0 flex-1 border border-line-strong bg-tile px-3 text-[14px] text-foreground outline-none focus-visible:border-blue"
        />
        <button type="submit" disabled={status.state === "working"} className={cn(buttonClass.primary, "-ml-px")}>
          {status.state === "working" ? "Checking…" : "Sign in"}
        </button>
      </div>
      {status.state === "error" && (
        <p role="alert" className="m-0 text-[13px] text-miss">
          {status.message}
        </p>
      )}
    </form>
  );
}

// "Sign out of admin", under the admin section menu
export function AdminSignOut() {
  const router = useRouter();
  const signOut = async () => {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => {});
    router.push("/");
    router.refresh();
  };
  return (
    <button type="button" onClick={signOut} className="eyebrow cursor-pointer bg-miss px-3 py-1.5 font-bold text-white hover:opacity-90">
      Sign out of admin
    </button>
  );
}
