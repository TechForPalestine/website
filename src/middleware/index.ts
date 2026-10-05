import { sequence } from "astro:middleware";
import { sentryInit } from "./sentry-init.js";
import { cacheControl } from "./cache-control.js";
import { csp } from "./csp.js";
import { securityHeaders } from "./security-headers.js";

// Order matters. Requests pass through top to bottom; responses come back bottom to top.
//
//   middleware       request (in)                       response (out)
//   ---------------  ---------------------------------  --------------------------------------
//   sentryInit       re-inits Sentry with the runtime   -
//                    DSN (see sentry-init.ts) so all
//                    later code reports correctly
//   securityHeaders  -                                  sets nosniff, Referrer-Policy,
//                                                       Permissions-Policy
//   cacheControl     -                                  sets Cache-Control (no-store for
//                                                       /api/, /admin and non-GET)
//   csp              sets locals.cspNonce               may REPLACE the response through
//                                                       HTMLRewriter (Workers only) and adds
//                                                       CSP + X-Frame-Options
//
// csp must stay last: it can swap the response object, so every header set by
// the middleware above has to already be on it. There must be only one entry
// point (this file); see index.test.ts, which pins this order.
export const onRequest = sequence(sentryInit, securityHeaders, cacheControl, csp);
