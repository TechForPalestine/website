import { sequence } from "astro:middleware";
import { sentryInit } from "./sentry-init.js";
import { cacheControl } from "./cache-control.js";
import { csp } from "./csp.js";

// sentryInit runs first so every later middleware and every API route's
// reportError() call reports to a correctly configured Sentry client — see
// sentry-init.ts for why the module-level sentry.server.config.js can't do
// this itself on Cloudflare Pages.
// cacheControl runs next so the header is set on every response.
// csp runs last and may replace the response via HTMLRewriter; the
// cache-control header is preserved on the transformed response.
export const onRequest = sequence(sentryInit, cacheControl, csp);
