import { SiteFooter } from "@/components/earnings/site-footer";
import { SiteHeader } from "@/components/earnings/site-header";
import { WatchlistsBoard } from "@/components/earnings/watchlists-board";
import { pageMetadata, SITE_NAME } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Watchlists",
  description: `Your ${SITE_NAME} watchlists: the companies you follow, ready to show on the earnings calendar.`,
  path: "/watchlists",
});

export default function WatchlistsPage() {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto box-border w-full max-w-360 flex-1 border-x">
          <header className="border-b px-6 pt-9 pb-7">
            <h1 className="display-type m-0 text-[clamp(36px,6vw,56px)]">
              Your <span className="text-blue">watchlists</span>.
            </h1>
          </header>
          <WatchlistsBoard />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
