import * as Sentry from "@sentry/astro";
import { sanitizeError } from "./sentry-scrub";
import { getRuntimeCtx } from "../utils/getEnv";

/** How long Workers may keep the isolate alive to deliver events after the response. */
export const SENTRY_FLUSH_MS = 2000;

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  const safeError = sanitizeError(error);
  console.error(safeError);
  Sentry.withScope((scope) => {
    if (context) scope.setContext("extra", context);
    Sentry.captureException(safeError);
  });
}

/**
 * reportError + flush via `waitUntil`, so the event is delivered before the
 * Worker is torn down. Use in catch blocks of routes that return an error response.
 *
 * Exceptions: the write routes keep their own inline flush, and
 * api/sentry-webhook.ts logs with console.error only (reporting a Sentry
 * webhook failure to Sentry would loop).
 */
export function reportAndFlush(
  error: unknown,
  context: Record<string, unknown> | undefined,
  locals: unknown
): void {
  reportError(error, context);
  getRuntimeCtx(locals)?.waitUntil(Promise.resolve(Sentry.flush(SENTRY_FLUSH_MS)));
}
