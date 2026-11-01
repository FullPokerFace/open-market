"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { LogOutIcon, UserIcon } from "lucide-react";

const item =
  "flex h-11 cursor-pointer items-center gap-2.5 border-b px-4 text-foreground no-underline outline-none last:border-b-0 data-highlighted:bg-tag";

// Header account button (desktop) for a signed-in visitor: who's signed in, their watchlists, sign out.
// Deleting the account stays on the Watchlists page so it can't be clicked by accident from here.
export function AccountMenu({ email, onSignOut, className }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`Account: ${email}`} title={`Signed in as ${email}`} className={className}>
        <UserIcon className="size-4" strokeWidth={2.2} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" className="z-50">
          <Menu.Popup className="eyebrow min-w-64 border bg-background text-foreground shadow-md outline-none">
            <div className="border-b px-4 py-3">
              <div className="text-muted-foreground">Signed in as</div>
              <div className="mt-1 truncate font-sans text-[13px] tracking-normal normal-case">{email}</div>
            </div>
            <Menu.LinkItem render={<Link href="/watchlists" />} className={item}>
              Watchlists &amp; notifications
            </Menu.LinkItem>
            <Menu.Item onClick={onSignOut} className={item}>
              <LogOutIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
