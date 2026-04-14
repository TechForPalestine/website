import { sequence } from "astro:middleware";
import { cacheControl } from "./cache-control.js";
import { csp } from "./csp.js";

// cacheControl runs first so the header is set on every response.
// csp runs second and may replace the response via HTMLRewriter; the
// cache-control header is preserved on the transformed response.
export const onRequest = sequence(cacheControl, csp);
