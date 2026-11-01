"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, BellOffIcon, CalendarIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { todayInNewYork } from "@/lib/earnings";
import { forgetAccount, linkAccount, linkedAccount, rememberList, useTickerLists } from "@/lib/ticker-lists";
import { cn } from "@/lib/utils";
import { TickerLabel } from "./company-logo";
import { CreateListDialog } from "./create-list-dialog";
import { SectionBar } from "./page-parts";
import { SignInDialog } from "./sign-in-dialog";

const button = "flex h-10 cursor-pointer items-center gap-2 px-4.5 font-mono text-[11px] font-bold tracking-[0.12em] uppercase";
const primary = "bg-foreground text-background";
const secondary = "border border-line-strong text-foreground hover:bg-tag";
const notifyOn = "border border-blue bg-blue text-background";
const linkButton = "cursor-pointer border-0 bg-transparent p-0 text-blue underline-offset-2 hover:underline disabled:opacity-60";

const noop = () => () => {};

// The visitor's watchlists (saved in the browser, and in their account when signed in): show one on the calendar,
// edit, delete, start a new one, or turn on the morning email for the days its companies report
export function WatchlistsBoard() {
  const router = useRouter();
  const { lists, create, update, remove, setNotify } = useTickerLists();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const user = session?.user ?? null;
  // The watchlist to turn notifications on for once the visitor has signed in
  const [notifyAfterSignIn, setNotifyAfterSignIn] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Signed in on another page or tab: save this browser's lists to the account. Signed out elsewhere or the
  // session ended: stop saving them there.
  useEffect(() => {
    if (sessionPending) return;
    if (user && linkedAccount() !== user.id) linkAccount(user.id).catch(() => {});
    if (!user && linkedAccount()) forgetAccount();
  }, [user, sessionPending]);

  const toggleNotify = (list) => {
    if (!user) {
      setNotifyAfterSignIn(list.id);
      setSignInOpen(true);
      return;
    }
    setNotify(list.id, !list.notify);
  };
  const onSignedIn = async (signedIn) => {
    await linkAccount(signedIn.id);
    if (notifyAfterSignIn) setNotify(notifyAfterSignIn, true);
    setNotifyAfterSignIn(null);
  };
  const signOut = async () => {
    setAccountBusy(true);
    await authClient.signOut().catch(() => {});
    forgetAccount();
    setAccountBusy(false);
  };
  const deleteAccount = async () => {
    const sure = window.confirm(
      "Delete your account? Your email address, saved watchlists and notifications are removed for good. The watchlists in this browser stay."
    );
    if (!sure) return;
    setAccountBusy(true);
    setAccountError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Couldn't delete your account. Please try again.");
      forgetAccount({ notificationsOff: true });
      await authClient.signOut().catch(() => {});
    } catch (e) {
      setAccountError(e.message);
    } finally {
      setAccountBusy(false);
    }
  };
  // Watchlists only exist in the browser: until hydrated, show neither them nor the empty state
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [dialogOpen, setDialogOpen] = useState(false);
  // The watchlist being edited, or null for a new one
  const [editing, setEditing] = useState(null);
  // The dialog's search month. Read on open, not while rendering: the page is prerendered at build time.
  const [month, setMonth] = useState("");

  const openDialog = (list) => {
    setEditing(list);
    setMonth(todayInNewYork().slice(0, 7));
    setDialogOpen(true);
  };
  const openNew = () => openDialog(null);
  const openEdit = (list) => openDialog(list);
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
          here. Watchlists are kept in this browser{user ? " and saved to your account" : ""}. Turn on{" "}
          <strong className="font-semibold text-foreground">Notify</strong> to get an email at 6 AM ET on days its
          companies report.
        </p>
        <button type="button" onClick={openNew} className={cn(button, primary)}>
          <PlusIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          New watchlist
        </button>
      </div>

      {hydrated && !sessionPending && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-tag px-6 py-3 text-[13px] text-body">
          {user ? (
            <>
              <span>
                Signed in as <strong className="font-semibold text-foreground">{user.email}</strong>
              </span>
              <button type="button" onClick={signOut} disabled={accountBusy} className={linkButton}>
                Sign out
              </button>
              <button type="button" onClick={deleteAccount} disabled={accountBusy} className={linkButton}>
                Delete account &amp; data
              </button>
            </>
          ) : (
            <>
              <span>Sign-in is only needed for earnings notifications. Everything else works without an account.</span>
              <button type="button" onClick={() => setSignInOpen(true)} className={linkButton}>
                Sign in
              </button>
            </>
          )}
          {accountError && (
            <span role="alert" className="text-miss">
              {accountError}
            </span>
          )}
        </div>
      )}

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
                  <NotifyButton list={list} on={Boolean(user && list.notify)} onClick={() => toggleNotify(list)} />
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
        month={month}
        list={editing}
        onSave={save}
      />
      <SignInDialog
        open={signInOpen}
        onOpenChange={(open) => {
          setSignInOpen(open);
          if (!open) setNotifyAfterSignIn(null);
        }}
        onSignedIn={onSignedIn}
      />
    </section>
  );
}

// Morning email for this watchlist on or off; signed out, it shows off and asks to sign in first
function NotifyButton({ list, on, onClick }) {
  const Icon = on ? BellIcon : BellOffIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={`${on ? "Turn off" : "Turn on"} earnings emails for ${list.name}`}
      title={on ? "You get an email on days these companies report" : "Get an email on days these companies report"}
      className={cn(button, on ? notifyOn : secondary)}
    >
      <Icon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
      {on ? "Notifying" : "Notify"}
    </button>
  );
}
