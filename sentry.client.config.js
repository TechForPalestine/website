import * as Sentry from "@sentry/astro";
import { sentryScrubOptions } from "./src/lib/sentry-scrub";

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? "production",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],
  tracesSampleRate: 0.1,
  ...sentryScrubOptions,
  allowUrls: [/techforpalestine\.org/, /pages\.dev/],
});
