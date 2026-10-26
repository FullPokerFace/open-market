import { cn } from "@/lib/utils";

// Building blocks of the text pages (Roadmap, About), styled like docs/features.html

export function SectionBar({ index, name, count }) {
  return (
    <div className="eyebrow flex flex-wrap justify-between gap-2 border-b px-6 py-2.5 text-muted-foreground">
      <span>
        {index} / <span className="text-foreground">{name}</span>
      </span>
      <span>{count}</span>
    </div>
  );
}

export function GroupTitle({ tone, children }) {
  return (
    <h3 className="display-type m-0 flex items-center gap-2.5 px-6 pt-6 pb-3 text-[22px] tracking-[-0.03em]">
      <span aria-hidden="true" className={cn("size-2.5 shrink-0", tone)} />
      {children}
    </h3>
  );
}

export function Item({ title, text }) {
  return (
    <li className="-mt-px -ml-px border-t border-l px-6 py-4">
      <div className="text-[15px] font-semibold text-strong">{title}</div>
      <p className="m-0 mt-1 text-[14px] text-body">{text}</p>
    </li>
  );
}
