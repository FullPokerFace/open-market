import { GITHUB_URL } from "@/lib/site";
import { FooterDate } from "./footer-date";
import { GitHubIcon } from "./github-icon";

export function SiteFooter() {
  return (
    <footer className="eyebrow mx-auto box-border flex w-full max-w-360 flex-wrap justify-between gap-2 border-x border-t px-6 py-2 text-muted-foreground">
      <span>
        Proudly made in <span className="text-foreground">New York, USA</span> by{" "}
        <a
          href="https://iwan-web.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue no-underline hover:underline"
        >
          Island Web Apps
        </a>
      </span>
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-foreground no-underline hover:underline"
        >
          <GitHubIcon className="size-3" />
          Open source on GitHub
        </a>
        <FooterDate />
      </span>
    </footer>
  );
}
