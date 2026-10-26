import { GroupTitle, Item, SectionBar } from "@/components/earnings/page-parts";
import { SiteFooter } from "@/components/earnings/site-footer";
import { SiteHeader } from "@/components/earnings/site-header";
import { SuggestFeatureButton } from "@/components/earnings/suggest-feature-dialog";
import { SuggestionBoard } from "@/components/earnings/suggestion-board";
import { SHIPPED, STAGES, UPCOMING } from "@/lib/roadmap";
import { pageMetadata, SITE_NAME } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Roadmap",
  description: `What's live in ${SITE_NAME} today, what's coming next, and the features visitors are voting for.`,
  path: "/roadmap",
});

const shippedCount = SHIPPED.reduce((sum, group) => sum + group.items.length, 0);
const total = shippedCount + UPCOMING.length;
const suggestButton = "eyebrow h-10 shrink-0 cursor-pointer bg-foreground px-4.5 text-[11px] font-bold tracking-[0.12em] text-background";

export default function RoadmapPage() {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto box-border w-full max-w-360 flex-1 border-x">
          <header className="border-b px-6 pt-9 pb-7">
            <h1 className="display-type m-0 mb-4 text-[clamp(36px,6vw,56px)]">
              {SITE_NAME} <span className="text-blue">roadmap</span>.
            </h1>
            <p className="m-0 max-w-190 text-[17px] text-body">
              <strong className="font-semibold text-foreground">
                What&apos;s live today, and what&apos;s being built next.
              </strong>{" "}
              Plans change with what the community asks for, so if something&apos;s missing, suggest it or build it.
            </p>
          </header>

          <section className="border-b">
            <SectionBar index="01" name="Requested" count="Vote for what's next" />
            <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-7 pb-6">
              <div>
                <h2 className="display-type m-0 text-[clamp(30px,4.5vw,40px)]">
                  User-suggested <span className="text-blue">features</span>.
                </h2>
                <p className="m-0 mt-2 max-w-190 text-[15px] text-body">
                  Ideas from visitors, most votes first. Vote for the ones you want built next: one vote per idea, click
                  it again to take it back.
                </p>
              </div>
              <SuggestFeatureButton className={suggestButton} />
            </div>
            <SuggestionBoard className="border-t" />
          </section>

          <Progress />

          <section className="border-b">
            <SectionBar index="02" name="Shipped" count={`${shippedCount} features`} />
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
            <SectionBar index="03" name="Coming" count={`${UPCOMING.length} planned`} />
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
              <p className="m-0 mt-1 text-[14px] text-body">Post it to the board so others can vote for it.</p>
            </div>
            <SuggestFeatureButton className={suggestButton} />
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
