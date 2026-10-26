import { OG_SIZE, renderOgImage } from "@/lib/og-image";
import { SITE_NAME } from "@/lib/site";

export const alt = `About ${SITE_NAME}: a free, open-source market toolkit built by its users`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage({
    eyebrow: "About",
    title: ["Built by its ", "users"],
    subtitle: "A free, open-source market toolkit, created and maintained by the people who use it.",
  });
}
