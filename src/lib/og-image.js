// Link-preview image (1200 × 630) in the site's light style: mono header bar, big display headline with a
// blue word, a row of ticker tiles and the site's address. Each route's opengraph-image.js picks the words.
// ImageResponse supports flexbox only: every element with more than one child needs `display: flex`.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_URL } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };

// Colors from globals.css (light theme)
const C = {
  bg: "#f2f1ee",
  tile: "#ffffff",
  ink: "#101014",
  strong: "#000000",
  body: "rgba(16, 16, 20, 0.72)",
  muted: "rgba(16, 16, 20, 0.55)",
  line: "rgba(16, 16, 20, 0.14)",
  blue: "#1a5bc4",
  beat: "#1d7a4c",
  miss: "#b83a24",
  mixed: "#8f5a00",
};

const TILES = [
  ["AAPL", C.beat],
  ["NVDA", C.beat],
  ["JPM", C.mixed],
  ["TSLA", C.miss],
  ["MSFT", C.beat],
  ["AMZN", null],
];

// Read once per server process: ImageResponse needs ttf / otf data, not the web fonts the pages use
let fonts;
const loadFonts = () =>
  (fonts ??= Promise.all(
    ["BricolageGrotesque-Bold.ttf", "GeistMono-Medium.ttf"].map((file) => readFile(join(process.cwd(), "src/og-fonts", file)))
  ).then(([display, mono]) => [
    { name: "Bricolage Grotesque", data: display, weight: 700, style: "normal" },
    { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
  ]));

const mono = { fontFamily: "Geist Mono", letterSpacing: "0.14em", textTransform: "uppercase" };

// One flex item per word: the image renderer drops spaces between separate spans, and the closing
// period rides on the last word so it can't wrap onto a line of its own
function headlineWords(plain, highlight) {
  const words = [
    ...plain.trim().split(/\s+/).map((word) => [word, C.strong]),
    ...highlight.trim().split(/\s+/).map((word) => [word, C.blue]),
  ];
  return words.map(([word, color], i) => (
    <div key={i} style={{ display: "flex", color, marginRight: "0.24em" }}>
      {word}
      {i === words.length - 1 && <span style={{ color: C.strong }}>.</span>}
    </div>
  ));
}

// `title` is [plain, blue]: "Every free market tool," + "in one place", then a period
export async function renderOgImage({ eyebrow, title: [plain, highlight], subtitle }) {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: C.bg, color: C.ink }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
            padding: "0 56px",
            borderBottom: `1px solid ${C.line}`,
            fontSize: 20,
            ...mono,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontWeight: 500 }}>
            <svg width="30" height="27" viewBox="0 0 20 18">
              <path d="M1 17L10 1l9 16h-4.5L10 9l-4.5 8z" fill={C.ink} />
            </svg>
            {SITE_NAME}
          </div>
          <div style={{ display: "flex", color: C.muted }}>{eyebrow}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 56px 0" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Bricolage Grotesque",
              fontSize: 88,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: C.strong,
            }}
          >
            {headlineWords(plain, highlight)}
          </div>
          <div style={{ display: "flex", marginTop: 28, maxWidth: 940, fontFamily: "Geist Mono", fontSize: 25, lineHeight: 1.45, color: C.body }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 56px 52px" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {TILES.map(([ticker, dot]) => (
              <div
                key={ticker}
                style={{
                  display: "flex",
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 84,
                  height: 84,
                  borderRadius: 16,
                  border: `1px solid ${C.line}`,
                  background: C.tile,
                  fontFamily: "Geist Mono",
                  fontSize: 19,
                  letterSpacing: "0.02em",
                  color: C.strong,
                }}
              >
                {ticker}
                {dot && (
                  <div
                    style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, background: dot, border: `3px solid ${C.bg}` }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 20, color: C.muted, ...mono }}>{new URL(SITE_URL).hostname.replace(/^www\./, "")}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() }
  );
}
