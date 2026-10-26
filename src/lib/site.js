// The app's name, address and home on GitHub, used in page titles, link previews, the header, footer, About page and emails
export const SITE_NAME = "Open Market";
export const SITE_DESCRIPTION = "A free, open-source earnings calendar, built and maintained by its community.";
export const SITE_URL = "https://www.getopenmarket.app";
export const GITHUB_URL = "https://github.com/FullPokerFace/open-market";

// Open Graph fields every page shares; the preview image comes from each route's opengraph-image.js
const SHARED_OPEN_GRAPH = { type: "website", siteName: SITE_NAME, locale: "en_US" };

// Metadata for a page: its <title> (the layout's template adds the app's name), description, canonical
// address and link preview. A page that sets `openGraph` replaces the layout's whole object, so it's built here.
export function pageMetadata({ title, description, path }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { ...SHARED_OPEN_GRAPH, title: `${title} · ${SITE_NAME}`, description, url: path },
  };
}

export const rootMetadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · Earnings calendar`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: { ...SHARED_OPEN_GRAPH, title: `${SITE_NAME} · Earnings calendar`, description: SITE_DESCRIPTION, url: "/" },
  // X reads the Open Graph title, description and image; this makes it show the image large
  twitter: { card: "summary_large_image" },
};
