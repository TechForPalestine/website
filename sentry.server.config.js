import * as Sentry from "@sentry/astro";

// `Sentry.init()` runs once at module load, before any request-scoped
// `locals` exists, so this can't go through `getEnv()`. On the deployed
// Cloudflare Pages Worker, dashboard-configured env vars never reach the
// global `process.env` (that only works in Node/dev) — they're inlined
// into `import.meta.env` at build time, the same way sentry.client.config.js
// already reads `import.meta.env.PUBLIC_SENTRY_DSN`. `process.env` stays as
// a fallback for local/Node contexts.
Sentry.init({
  dsn: import.meta.env.SENTRY_DSN ?? process.env.SENTRY_DSN,
  environment: import.meta.env.SENTRY_ENVIRONMENT ?? process.env.SENTRY_ENVIRONMENT ?? "production",
  tracesSampleRate: 0.1,
});
