import { Suspense } from "react";
import { SiteFooter } from "@/components/earnings/site-footer";
import { SiteHeader } from "@/components/earnings/site-header";
import { UnsubscribePanel } from "@/components/earnings/unsubscribe-panel";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Unsubscribe",
  description: `Stop ${SITE_NAME} earnings notification emails.`,
  robots: { index: false },
};

// Linked from the morning email. Opening it changes nothing (mail scanners open links); the button unsubscribes.
export default function UnsubscribePage({ searchParams }) {
  return (
    <>
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto box-border w-full max-w-360 flex-1 border-x">
          <header className="border-b px-6 pt-9 pb-7">
            <h1 className="display-type m-0 text-[clamp(36px,6vw,56px)]">
              Earnings <span className="text-blue">emails</span>.
            </h1>
          </header>
          <Suspense fallback={null}>
            <UnsubscribePanel searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
