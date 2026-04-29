import * as Sentry from "@sentry/astro";

export function reportError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error(error);
  Sentry.withScope((scope) => {
    if (context) scope.setContext("extra", context);
    Sentry.captureException(error);
  });
}
