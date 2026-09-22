import { defineMiddleware } from "astro:middleware";
import * as Sentry from "@sentry/astro";
import { getEnv } from "../utils/getEnv";

/**
 * `sentry.server.config.js`'s top-level `Sentry.init()` runs once at Worker
 * module load, before any request exists — and on Cloudflare Pages,
 * dashboard-configured env vars are only ever visible per-request, via
 * `locals.runtime.env`, never at module-load time. `import.meta.env` only
 * carries a var if it was also present at *build* time, which a runtime-only
 * dashboard var never is. That leaves the module-level init with no real DSN
 * whenever — as here — `SENTRY_DSN` is only configured as a runtime var, the
 * same scope `QGIV_API_TOKEN` already uses successfully via `getEnv()`.
 *
 * `Sentry.init()` is safe to call again — a later call reconfigures the
 * global client — so this middleware re-initializes it on the first request
 * each Worker isolate handles, this time with a DSN `getEnv()` can actually
 * see. It deliberately does NOT guard on `Sentry.isInitialized()`: that flips
 * true the moment the module-level init runs, even with `dsn: undefined`, so
 * it would never let this real init through. A local flag avoids relying on
 * that ambiguous SDK state.
 *
 * Runs first in the middleware chain (see index.ts) so every later
 * middleware and every API route's `reportError()` call sees a correctly
 * configured client.
 */
let reinitialized = false;

export const sentryInit = defineMiddleware(async (context, next) => {
  if (!reinitialized) {
    const dsn = getEnv("SENTRY_DSN", context.locals);
    if (dsn) {
      Sentry.init({
        dsn,
        environment: getEnv("SENTRY_ENVIRONMENT", context.locals) ?? "production",
        tracesSampleRate: 0.1,
      });
      reinitialized = true;
    }
  }

  return next();
});
