import { cn } from "@/lib/utils";

export function SectionBar({ index, title, aside, className }) {
  return (
    <div
      className={cn(
        "eyebrow flex flex-wrap justify-between gap-2 px-6 py-2.5 text-muted-foreground",
        className
      )}
    >
      <span>
        {index} / <span className="text-foreground">{title}</span>
      </span>
      {aside && <span>{aside}</span>}
    </div>
  );
}
