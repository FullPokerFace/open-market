"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 2000;
const actionButton = "h-10 px-4.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";

// Any button that opens the dialog: the header menu item, the roadmap's call to action
export function SuggestFeatureButton({ className, children = "Suggest a feature" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <SuggestFeatureDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// The suggestion is emailed to the site owner through /api/suggestions
export function SuggestFeatureDialog({ open, onOpenChange }) {
  const [message, setMessage] = useState("");
  // idle | sending | sent | error
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const changeOpen = (next) => {
    // Start fresh after a suggestion went through; keep an unsent draft
    if (!next && status === "sent") {
      setMessage("");
      setStatus("idle");
    }
    onOpenChange(next);
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't send that. Please try again shortly.");
      setStatus("sent");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  };

  const tooShort = message.trim().length < 3;

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-xl bg-background">
        <div className="eyebrow flex items-center justify-between border-b pl-6 text-muted-foreground">
          <span>
            Feedback / <span className="text-foreground">Suggest a feature</span>
          </span>
          <DialogClose aria-label="Close" className="grid h-11 w-12 cursor-pointer place-items-center border-l text-foreground">
            <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="border-b px-6 py-4">
          <DialogTitle className="display-type text-[28px] font-bold">
            Suggest a <span className="text-blue">feature</span>.
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-body">
            What would make this calendar more useful? It goes straight to the developer&apos;s inbox.
          </DialogDescription>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col items-start gap-4 px-6 py-6">
            <p role="status" className="m-0 text-[14px] text-foreground">
              <span className="font-bold text-beat">Sent.</span> Thanks for the idea!
            </p>
            <DialogClose render={<Button className={actionButton} />}>Close</DialogClose>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 px-6 py-6">
            <Label htmlFor="feature-suggestion" className="eyebrow text-muted-foreground">
              Your suggestion
            </Label>
            <Textarea
              id="feature-suggestion"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_LENGTH}
              placeholder="e.g. Add a P/L calendar"
              aria-invalid={status === "error" || undefined}
              aria-describedby={status === "error" ? "feature-suggestion-error" : undefined}
              className="min-h-32 border-line-strong bg-tile text-[14px] md:text-[14px]"
              autoFocus
            />
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow text-[10px] text-muted-foreground">
                {message.length} / {MAX_LENGTH}
              </span>
              <Button type="submit" disabled={tooShort || status === "sending"} className={actionButton}>
                {status === "sending" ? "Sending…" : "Send"}
              </Button>
            </div>
            {status === "error" && (
              <p id="feature-suggestion-error" role="alert" className="m-0 text-[13px] text-miss">
                {error}
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
