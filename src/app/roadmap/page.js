import { SiteFooter } from "@/components/earnings/site-footer";
import { SiteHeader } from "@/components/earnings/site-header";
import { SuggestFeatureButton } from "@/components/earnings/suggest-feature-dialog";
import { SHIPPED, STAGES, UPCOMING } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Roadmap · Earnings Report",
  description: "What's live in Earnings Report today and what's coming next.",
};

const shippedCount = SHIPPED.reduce((sum, group) => sum + group.items.length, 0);
const total = shippedCount + UPCOMING.length;

export default function RoadmapPage() {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto box-border w-full max-w-360 flex-1 border-x">
          <header className="border-b px-6 pt-9 pb-7">
            <h1 className="display-type m-0 mb-4 text-[clamp(36px,6vw,56px)]">
              Earnings Report <span className="text-blue">roadmap</span>.
            </h1>
            <p className="m-0 max-w-190 text-[17px] text-body">
              <strong className="font-semibold text-foreground">
                What&apos;s live today, and what&apos;s being built next.
              </strong>{" "}
              Plans change with what people ask for, so if something&apos;s missing, suggest it.
            </p>
          </header>

          <Progress />

          <section className="border-b">
            <SectionBar index="01" name="Shipped" count={`${shippedCount} features`} />
            <div className="px-6 pt-7 pb-1">
              <h2 className="display-type m-0 text-[clamp(30px,4.5vw,40px)]">
                What&apos;s <span className="text-beat">live</span>.
              </h2>
            </div>
            {SHIPPED.map((group) => (
              <div key={group.area}>
                <GroupTitle tone="bg-beat">{group.area}</GroupTitle>
                <ul className="m-0 grid list-none grid-cols-1 border-t p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map(([title, text]) => (
                    <Item key={title} title={title} text={text} />
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="border-b">
            <SectionBar index="02" name="Coming" count={`${UPCOMING.length} planned`} />
            <div className="px-6 pt-7 pb-1">
              <h2 className="display-type m-0 text-[clamp(30px,4.5vw,40px)]">
                What&apos;s <span className="text-blue">next</span>.
              </h2>
            </div>
            {STAGES.map((stage) => (
              <div key={stage.key}>
                <GroupTitle tone={stage.swatch}>{stage.label}</GroupTitle>
                <ul className="m-0 grid list-none grid-cols-1 border-t p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {UPCOMING.filter((item) => item.stage === stage.key).map((item) => (
                    <Item key={item.title} title={item.title} text={item.text} />
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="flex flex-wrap items-center justify-between gap-4 px-6 py-7">
            <div>
              <h2 className="display-type m-0 text-[28px]">
                Have an <span className="text-blue">idea</span>?
              </h2>
              <p className="m-0 mt-1 text-[14px] text-body">It goes straight to the developer&apos;s inbox.</p>
            </div>
            <SuggestFeatureButton className="eyebrow h-10 cursor-pointer bg-foreground px-4.5 text-[11px] font-bold tracking-[0.12em] text-background" />
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

function Progress() {
  const percent = Math.round((shippedCount / total) * 100);
  return (
    <div className="border-b px-6 py-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <b className="display-type text-[56px] leading-none text-beat">{percent}%</b>
        <span className="text-body">
          {shippedCount} of {total} features live · {UPCOMING.length} to go
        </span>
      </div>
      <div
        role="img"
        aria-label={`${shippedCount} live, ${UPCOMING.length} coming`}
        className="mt-4 flex h-4 gap-0.5"
      >
        <span className="bg-beat" style={{ flex: shippedCount }} />
        {STAGES.map((stage) => (
          <span
            key={stage.key}
            className={stage.swatch}
            style={{ flex: UPCOMING.filter((item) => item.stage === stage.key).length }}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBar({ index, name, count }) {
  return (
    <div className="eyebrow flex flex-wrap justify-between gap-2 border-b px-6 py-2.5 text-muted-foreground">
      <span>
        {index} / <span className="text-foreground">{name}</span>
      </span>
      <span>{count}</span>
    </div>
  );
}

function GroupTitle({ tone, children }) {
  return (
    <h3 className="display-type m-0 flex items-center gap-2.5 px-6 pt-6 pb-3 text-[22px] tracking-[-0.03em]">
      <span aria-hidden="true" className={cn("size-2.5 shrink-0", tone)} />
      {children}
    </h3>
  );
}

function Item({ title, text }) {
  return (
    <li className="-mt-px -ml-px border-t border-l px-6 py-4">
      <div className="text-[15px] font-semibold text-strong">{title}</div>
      <p className="m-0 mt-1 text-[14px] text-body">{text}</p>
    </li>
  );
}
