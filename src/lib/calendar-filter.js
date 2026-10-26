// Server-only: the calendar filter for this request
import { cookies } from "next/headers";
import { LIST_COOKIE, parseFilter } from "./earnings";

// The market in the URL; without one, the list the visitor last picked (saved in a cookie
// by ticker-lists.js), else the default market. Lists stay out of the URL.
export async function requestFilter(exchange) {
  if (exchange) return parseFilter({ exchange });
  return parseFilter({ tickers: decodeCookie((await cookies()).get(LIST_COOKIE)?.value) });
}

// Set with encodeURIComponent in the browser; tolerate a value that's already decoded or garbled
function decodeCookie(value) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
