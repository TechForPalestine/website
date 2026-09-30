/**
 * Strips URL query strings (which can carry auth tokens, e.g. EVENTS_ICS_URL)
 * from anything headed to Sentry or the console.
 */
const URL_WITH_QUERY = /(https?:\/\/[^\s"'<>?#]+)\?[^\s"'<>#]*/g;

export function scrubString(value: string): string {
  return value.replace(URL_WITH_QUERY, "$1?[redacted]");
}

function scrubUrlField(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const scrubbed = scrubString(value);
  if (scrubbed !== value) return scrubbed;
  // Relative or bare URLs: cut anything after "?" (keep any hash out too)
  const q = value.indexOf("?");
  return q === -1 ? value : `${value.slice(0, q)}?[redacted]`;
}

function scrubData(data: any): void {
  if (!data || typeof data !== "object") return;
  for (const key of ["url", "http.url", "http.query", "http.target", "from", "to"]) {
    if (key in data) data[key] = scrubUrlField(data[key]);
  }
}

export function beforeBreadcrumb(breadcrumb: any): any {
  if (typeof breadcrumb.message === "string") {
    breadcrumb.message = scrubString(breadcrumb.message);
  }
  scrubData(breadcrumb.data);
  return breadcrumb;
}

export function beforeSend(event: any): any {
  if (typeof event.message === "string") event.message = scrubString(event.message);
  for (const ex of event.exception?.values ?? []) {
    if (typeof ex.value === "string") ex.value = scrubString(ex.value);
  }
  if (event.request) {
    event.request.url = scrubUrlField(event.request.url);
    delete event.request.query_string;
  }
  for (const crumb of event.breadcrumbs ?? []) beforeBreadcrumb(crumb);
  return event;
}

export function beforeSendTransaction(event: any): any {
  if (event.request) {
    event.request.url = scrubUrlField(event.request.url);
    delete event.request.query_string;
  }
  for (const span of event.spans ?? []) {
    if (typeof span.description === "string") span.description = scrubString(span.description);
    scrubData(span.data);
  }
  return event;
}

/** Spread into every Sentry.init() call. */
export const sentryScrubOptions = { beforeBreadcrumb, beforeSend, beforeSendTransaction };

/** Returns an Error safe to log/report: message scrubbed, stack scrubbed. */
export function sanitizeError(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return typeof error === "string" ? scrubString(error) : error;
  }
  const safe = new Error(scrubString(error.message));
  safe.name = error.name;
  if (error.stack) safe.stack = scrubString(error.stack);
  return safe;
}
