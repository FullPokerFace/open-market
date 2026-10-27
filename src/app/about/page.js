import Link from "next/link";
import { GitHubIcon } from "@/components/earnings/github-icon";
import { GroupTitle, Item, SectionBar } from "@/components/earnings/page-parts";
import { SiteFooter } from "@/components/earnings/site-footer";
import { SiteHeader } from "@/components/earnings/site-header";
import { SuggestFeatureButton } from "@/components/earnings/suggest-feature-dialog";
import { GITHUB_URL, pageMetadata, SITE_NAME } from "@/lib/site";

export const metadata = pageMetadata({
  title: "About",
  description: `${SITE_NAME} is a free, open-source earnings calendar whose features are created and maintained by its community.`,
  path: "/about",
});

const DESIGN_INSPIRATION_URL = "https://getartcraft.com";

const OFFERS = [
  ["Earnings calendar", "Every company reporting, by day, week or month, marked by when it reports and how it did."],
  ["Your own watchlists", "Follow just the companies you care about; your last watchlist opens next time."],
  ["Market context", "The Fear & Greed Index and the next Fed, CPI, jobs and GDP releases with their expectations."],
  ["Company details", "EPS and revenue against estimates, the surprise history, and links to SEC filings."],
];

const STEPS = [
  ["1 · Suggest", "Tell us what's missing with Suggest a feature, or open an issue on GitHub. Ideas shape the roadmap."],
  ["2 · Build", "Pick something from the roadmap or your own idea, fork the repo and send a pull request."],
  ["3 · Maintain", "Review changes, fix what breaks and keep features working: the people who use the app look after it."],
];

const CREDITS = [
  ["Finnhub", "Earnings calendar, company profiles and EPS history.", "https://finnhub.io"],
  ["SEC EDGAR", "Company names and filings.", "https://www.sec.gov/edgar"],
  ["Kalshi", "Expectations for the Fed decision and economic releases.", "https://kalshi.com"],
  ["CNN Fear & Greed", "The market sentiment meter.", "https://www.cnn.com/markets/fear-and-greed"],
  ["ArtCraft", "The app's design is inspired by getartcraft.com.", DESIGN_INSPIRATION_URL],
];

const button = "eyebrow inline-flex h-10 cursor-pointer items-center gap-2 px-4.5 text-[11px] font-bold tracking-[0.12em] no-underline";

export default function AboutPage() {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto box-border w-full max-w-360 flex-1 border-x">
          <header className="border-b px-6 pt-9 pb-7">
            <h1 className="display-type m-0 mb-4 text-[clamp(36px,6vw,56px)]">
              About <span className="text-blue">{SITE_NAME}</span>.
            </h1>
            <p className="m-0 max-w-190 text-[17px] text-body">
              <strong className="font-semibold text-foreground">
                A free, open-source earnings calendar, made for its users to create and maintain features together as a
                community.
              </strong>{" "}
              There&apos;s no company deciding what comes next: anyone who uses {SITE_NAME} can suggest a feature, build
              it, and help keep it working.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${button} bg-foreground text-background`}
              >
                <GitHubIcon className="size-3.5" />
                View on GitHub ↗
              </a>
              <Link href="/roadmap" className={`${button} border border-line-strong text-foreground`}>
                See the roadmap
              </Link>
            </div>
          </header>

          <section className="border-b">
            <SectionBar index="01" name="What it is" count={`${OFFERS.length} areas`} />
            <div className="px-6 pt-7 pb-1">
              <h2 className="display-type m-0 text-[clamp(30px,4.5vw,40px)]">
                Earnings, <span className="text-beat">at a glance</span>.
              </h2>
            </div>
            <GroupTitle tone="bg-beat">What you get</GroupTitle>
            <ul className="m-0 grid list-none grid-cols-1 border-t p-0 sm:grid-cols-2 lg:grid-cols-4">
              {OFFERS.map(([title, text]) => (
                <Item key={title} title={title} text={text} />
              ))}
            </ul>
          </section>

          <section className="border-b">
            <SectionBar index="02" name="Community" count="Open source" />
            <div className="px-6 pt-7 pb-1">
              <h2 className="display-type m-0 text-[clamp(30px,4.5vw,40px)]">
                Built by its <span className="text-blue">users</span>.
              </h2>
              <p className="m-0 mt-3 max-w-190 text-[15px] text-body">
                {SITE_NAME} is meant for the people who use it to create and maintain its features as a community. The code
                is public on{" "}
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-blue no-underline hover:underline">
                  GitHub
                </a>
                , the <Link href="/roadmap" className="text-blue no-underline hover:underline">roadmap</Link> is shaped by
                what people ask for, and every change goes in as a pull request anyone can read.
              </p>
            </div>
            <GroupTitle tone="bg-blue">How to take part</GroupTitle>
            <ul className="m-0 grid list-none grid-cols-1 border-t p-0 sm:grid-cols-3">
              {STEPS.map(([title, text]) => (
                <Item key={title} title={title} text={text} />
              ))}
            </ul>
          </section>

          <section className="border-b">
            <SectionBar index="03" name="Credits" count={`${CREDITS.length} sources`} />
            <div className="px-6 pt-7 pb-1">
              <h2 className="display-type m-0 text-[clamp(30px,4.5vw,40px)]">
                Data &amp; <span className="text-blue">design</span>.
              </h2>
            </div>
            <GroupTitle tone="bg-muted-foreground">With thanks to</GroupTitle>
            <ul className="m-0 grid list-none grid-cols-1 border-t p-0 sm:grid-cols-2 lg:grid-cols-3">
              {CREDITS.map(([title, text, href]) => (
                <li key={title} className="-mt-px -ml-px border-t border-l px-6 py-4">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-semibold text-strong no-underline hover:underline"
                  >
                    {title} ↗
                  </a>
                  <p className="m-0 mt-1 text-[14px] text-body">{text}</p>
                </li>
              ))}
            </ul>
            <p className="m-0 border-t px-6 py-4 text-[13px] text-muted-foreground">
              {SITE_NAME} is for information only and isn&apos;t investment advice. Data can be late or wrong; check a
              company&apos;s own filings before acting on it.
            </p>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-4 px-6 py-7">
            <div>
              <h2 className="display-type m-0 text-[28px]">
                Have an <span className="text-blue">idea</span>?
              </h2>
              <p className="m-0 mt-1 text-[14px] text-body">Suggest it here, or build it and open a pull request.</p>
            </div>
            <SuggestFeatureButton className={`${button} bg-foreground text-background`} />
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
