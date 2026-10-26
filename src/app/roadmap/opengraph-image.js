import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} roadmap: suggest a feature and vote on what gets built next`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "Roadmap",
    title: ["What's next is ", "your call"],
    subtitle: "Suggest a feature, vote on everyone else's, and see what's live and what's coming.",
  });
}
