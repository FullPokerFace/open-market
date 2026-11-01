"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const link = "eyebrow cursor-pointer text-[10px] text-blue hover:underline disabled:opacity-50";

// Delete, then "Yes, delete" / "Keep" before anything happens
export function DeleteUser({ id }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) setError((await res?.json().catch(() => ({})))?.error || "Something went wrong.");
    setBusy(false);
    setConfirm(false);
    router.refresh();
  };

  return (
    <>
      {confirm ? (
        <span className="flex flex-wrap gap-4">
          <button type="button" disabled={busy} onClick={remove} className={cn(link, "text-miss")}>
            {busy ? "Deleting…" : "Yes, delete"}
          </button>
          <button type="button" disabled={busy} onClick={() => setConfirm(false)} className={link}>
            Keep
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirm(true)} className={cn(link, "text-miss")}>
          Delete
        </button>
      )}
      {error && (
        <p role="alert" className="m-0 mt-1 text-[12px] text-miss">
          {error}
        </p>
      )}
    </>
  );
}
