import { SiteFooter } from "@/components/earnings/site-footer";
import { SiteHeader } from "@/components/earnings/site-header";
import { cn } from "@/lib/utils";

// Shared bits of the admin pages, styled like the rest of the site (docs/DESIGN.md)

// Header, the framed content column and the footer
export function AdminPage({ children }) {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto box-border w-full max-w-360 flex-1 border-x">{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}

export function SectionBar({ index, name, note, className }) {
  return (
    <div className={cn("eyebrow flex flex-wrap justify-between gap-2 border-b px-6 py-2.5 text-muted-foreground", className)}>
      <span>
        {index} / <span className="text-foreground">{name}</span>
      </span>
      {note && <span>{note}</span>}
    </div>
  );
}

// Big Bricolage title with one blue word and a closing period: <PageTitle before="All" accent="users" />
export function PageTitle({ before, accent }) {
  return (
    <h1 className="display-type m-0 text-[clamp(36px,6vw,56px)]">
      {before && `${before} `}
      <span className="text-blue">{accent}</span>.
    </h1>
  );
}

export function Message({ children }) {
  return <p className="m-0 px-6 py-10 text-center text-body">{children}</p>;
}

// 40px square buttons and links
export const buttonClass = {
  primary:
    "eyebrow inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-foreground px-4.5 text-[11px] font-bold tracking-[0.12em] text-background no-underline disabled:cursor-default disabled:opacity-50",
  secondary:
    "eyebrow inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 border border-line-strong px-4.5 text-[11px] font-bold tracking-[0.12em] text-foreground no-underline hover:bg-tag disabled:cursor-default disabled:opacity-50",
};

// "Nov 1, 2026", in New York time like the calendar
export const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }).format(
    new Date(date)
  );
