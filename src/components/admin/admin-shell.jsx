import { Fragment } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AdminSignOut } from "./login-form";
import { SectionBar } from "./parts";

const SECTIONS = [{ key: "users", href: "/admin", label: "Users" }];

// Every signed-in admin page: the section menu on the side (a row above the page on small screens) and the
// breadcrumb bar. Render it after requireAdmin(). `active`: a SECTIONS key. `crumbs`: [{ label, href? }] after "Admin";
// the last one is the current page.
export function AdminShell({ active, crumbs = [], note, children }) {
  return (
    <>
      <div className="border-b px-6 py-4">
        <p className="display-type m-0 text-[clamp(22px,3vw,28px)] text-foreground">Admin panel</p>
      </div>
      <div className="md:grid md:grid-cols-[12rem_minmax(0,1fr)]">
        <aside className="border-b md:border-r md:border-b-0">
          <nav aria-label="Admin" className="eyebrow flex overflow-x-auto md:sticky md:top-0 md:flex-col md:overflow-visible">
            {SECTIONS.map(({ key, href, label }) => (
              <Link
                key={key}
                href={href}
                aria-current={key === active ? "page" : undefined}
                className={cn(
                  "flex h-11 shrink-0 items-center border-r px-6 text-foreground no-underline hover:bg-tag md:border-r-0 md:border-b",
                  key === active && "bg-foreground text-background hover:bg-foreground"
                )}
              >
                {label}
              </Link>
            ))}
            <span className="flex shrink-0 items-center px-6 md:py-3">
              <AdminSignOut />
            </span>
          </nav>
        </aside>
        <div className="min-w-0">
          <SectionBar index="00" name={<Breadcrumbs crumbs={[{ label: "Admin", href: "/admin" }, ...crumbs]} />} note={note} />
          {children}
        </div>
      </div>
    </>
  );
}

function Breadcrumbs({ crumbs }) {
  return (
    <nav aria-label="Breadcrumb" className="inline">
      {crumbs.map(({ label, href }, i) => {
        const last = i === crumbs.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span className="text-muted-foreground"> / </span>}
            {last || !href ? (
              <span aria-current={last ? "page" : undefined}>{label}</span>
            ) : (
              <Link href={href} className="text-muted-foreground no-underline hover:text-foreground hover:underline">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
