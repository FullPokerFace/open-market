import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPage, buttonClass, Message, PageTitle } from "@/components/admin/parts";
import { UsersTable } from "@/components/admin/users-table";
import { listUsers, requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin", robots: { index: false } };

const PER_PAGE = 15;

export default function AdminUsersPage({ searchParams }) {
  return (
    <AdminPage>
      <Suspense fallback={<Message>Loading…</Message>}>
        <Users searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

// ?q= filters by email, ?page= picks the page (1-based)
async function Users({ searchParams }) {
  await connection();
  await requireAdmin("/admin");
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);

  const { users, total } = await listUsers({ query, page, perPage: PER_PAGE });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (to) => {
    const search = new URLSearchParams({ ...(query && { q: query }), ...(to > 1 && { page: String(to) }) }).toString();
    return search ? `/admin?${search}` : "/admin";
  };

  return (
    <AdminShell active="users" crumbs={query ? [{ label: "Users", href: "/admin" }, { label: `Search “${query}”` }] : [{ label: "Users" }]}>
      <header className="border-b px-6 pt-8 pb-6">
        <PageTitle before="All" accent="users" />
        <p className="m-0 mt-3 max-w-190 text-[15px] text-body">
          {total} {total === 1 ? "account" : "accounts"}
          {query ? <> matching &ldquo;{query}&rdquo;</> : null}, newest first.
        </p>
      </header>
      <form action="/admin" className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-6 py-4">
        <label htmlFor="users-search" className="eyebrow text-muted-foreground">
          Search by email
        </label>
        <div className="flex min-w-0 flex-1 basis-72">
          <input
            key={query}
            id="users-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="name@example.com"
            className="h-10 min-w-0 flex-1 border border-line-strong bg-tile px-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-blue"
          />
          <button type="submit" className={cn(buttonClass.primary, "-ml-px")}>
            Search
          </button>
        </div>
        {query && (
          <Link href="/admin" className="eyebrow text-[10px] text-blue no-underline hover:underline">
            Clear
          </Link>
        )}
      </form>
      {query && !total ? (
        <p className="m-0 px-6 py-5 text-[14px] text-body">No accounts match that email.</p>
      ) : (
        <UsersTable users={users} />
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-4 px-6 py-4">
          {page > 1 ? (
            <Link href={href(Math.min(page - 1, pages))} className={buttonClass.secondary}>
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="eyebrow text-muted-foreground">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} className={buttonClass.secondary}>
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </AdminShell>
  );
}
