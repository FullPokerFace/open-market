"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const actionButton = "h-10 px-4.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";
const field = "h-10 w-full min-w-0 border border-line-strong bg-tile px-3 text-[14px] text-foreground outline-none focus-visible:border-ring";
const linkButton = "cursor-pointer border-0 bg-transparent p-0 text-[13px] text-blue underline-offset-2 hover:underline";

const CODE_LENGTH = 6;

// Sign in with a code emailed to the visitor; entering it proves the address is theirs. No passwords, and a
// first sign-in creates the account. `onSignedIn(user)` runs once signed in, before the dialog closes.
export function SignInDialog({ open, onOpenChange, onSignedIn }) {
  // email: asking for the address; code: waiting for the code sent to it
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const reset = () => {
    setStep("email");
    setCode("");
    setError("");
    setResent(false);
  };
  const changeOpen = (next) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const sendCode = async () => {
    setBusy(true);
    setError("");
    const { error: failed } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
    setBusy(false);
    if (failed) {
      setError(failed.status === 429 ? "Too many codes asked for. Wait a few minutes and try again." : "We couldn't send a code to that address. Check it and try again.");
      return false;
    }
    return true;
  };

  const submitEmail = async (event) => {
    event.preventDefault();
    if (busy || !email.trim()) return;
    if (await sendCode()) {
      setCode("");
      setResent(false);
      setStep("code");
    }
  };

  const resend = async () => {
    if (busy) return;
    if (await sendCode()) setResent(true);
  };

  const submitCode = async (event) => {
    event.preventDefault();
    if (busy || code.length !== CODE_LENGTH) return;
    setBusy(true);
    setError("");
    const { data, error: failed } = await authClient.signIn.emailOtp({ email: email.trim(), otp: code });
    if (failed) {
      setBusy(false);
      const tooMany = failed.code === "TOO_MANY_ATTEMPTS";
      setError(
        tooMany
          ? "Too many wrong tries. Ask for a new code."
          : failed.code === "OTP_EXPIRED"
            ? "That code has expired. Ask for a new one."
            : "That code isn't right. Check the email and try again."
      );
      return;
    }
    try {
      await onSignedIn?.(data.user);
      changeOpen(false);
    } catch (e) {
      setError(e.message || "Signed in, but something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-md overflow-y-auto overscroll-contain bg-background">
        <div className="eyebrow flex shrink-0 items-center justify-between border-b pl-6 text-muted-foreground">
          <span>
            Account / <span className="text-foreground">Sign in</span>
          </span>
          <DialogClose aria-label="Close" className="grid h-11 w-12 cursor-pointer place-items-center border-l text-foreground">
            <XIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="display-type text-[28px] font-bold">
            Get earnings <span className="text-blue">emails</span>.
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-body">
            Sign-in is only needed for earnings notifications. Everything else works without an account. No password: we
            email you a code.
          </DialogDescription>
        </div>

        {step === "email" ? (
          <form onSubmit={submitEmail} className="flex shrink-0 flex-col gap-5 px-6 py-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-in-email" className="eyebrow text-muted-foreground">
                Email
              </Label>
              <input
                id="sign-in-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className={field}
                autoFocus
              />
            </div>
            {error && (
              <p role="alert" className="m-0 text-[13px] text-miss">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={busy || !email.trim()} className={actionButton}>
                {busy ? "Sending…" : "Email me a code"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitCode} className="flex shrink-0 flex-col gap-5 px-6 py-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sign-in-code" className="eyebrow text-muted-foreground">
                Code sent to {email.trim()}
              </Label>
              <input
                id="sign-in-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                className={`${field} font-mono text-[20px] tracking-[0.3em]`}
                autoFocus
              />
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <button type="button" onClick={resend} disabled={busy} className={linkButton}>
                  {resent ? "New code sent" : "Send a new code"}
                </button>
                <button type="button" onClick={reset} disabled={busy} className={linkButton}>
                  Use another email
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="m-0 text-[13px] text-miss">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={busy || code.length !== CODE_LENGTH} className={actionButton}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
