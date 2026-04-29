import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? "development",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],
  tracesSampleRate: 0.1,
  allowUrls: [/techforpalestine\.org/, /pages\.dev/],
});
