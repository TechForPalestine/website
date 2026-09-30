import * as Sentry from "@sentry/astro";
import { sanitizeError } from "./sentry-scrub";

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const safeError = sanitizeError(error);
  console.error(safeError);
  Sentry.withScope((scope) => {
    if (context) scope.setContext("extra", context);
    Sentry.captureException(safeError);
  });
}
