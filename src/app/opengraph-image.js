import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { SITE_NAME } from "@/lib/site";

// Link preview for the calendar, and for any page without its own opengraph-image
export const alt = `${SITE_NAME}: every free market tool in one place`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Earnings calendar",
    title: ["Every free market tool, ", "in one place"],
    subtitle: "Earnings dates and results, Fear & Greed, Fed odds and macro releases. Free and open source.",
  });
}
