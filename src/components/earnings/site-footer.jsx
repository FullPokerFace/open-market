import { FooterDate } from "./footer-date";

export function SiteFooter() {
  return (
    <footer className="eyebrow mx-auto box-border flex w-full max-w-360 flex-wrap justify-between gap-2 border-x border-t px-6 py-2.5 text-muted-foreground">
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
      <FooterDate />
    </footer>
  );
}
