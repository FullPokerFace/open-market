import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

// Serves the planning doc docs/gamma-exposure.html as-is, so it can be shared by link.
// Kept out of search results; the file is listed in outputFileTracingIncludes so it ships with the server.
async function readDoc() {
  "use cache";
  cacheLife("max");
  return readFile(path.join(process.cwd(), "docs", "gamma-exposure.html"), "utf8");
}

export async function GET() {
  return new Response(await readDoc(), {
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
