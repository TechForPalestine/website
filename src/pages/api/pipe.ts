import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../../lib/report-error";

const ALLOWED_ORIGIN = "https://techforpalestine.org";
const PLAUSIBLE_API = "https://plausible.io/api/event";

function parseEventName(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return parsed.n || parsed.name || "unknown";
  } catch {
    return "unparseable";
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const ctx = (locals as { runtime?: { ctx?: { waitUntil: (p: Promise<unknown>) => void } } }).runtime?.ctx;
  const origin = request.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) {
    return new Response("Forbidden", { status: 403 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  const forwardedFor = request.headers.get("cf-connecting-ip");
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  const body = await request.text();
  const eventName = parseEventName(body);

  try {
    const response = await fetch(PLAUSIBLE_API, {
      method: "POST",
      headers,
      body,
    });

    const dropped = response.headers.get("x-plausible-dropped") === "1";

    if (dropped) {
      reportError(new Error("Plausible dropped event"), {
        context: "pipe",
        eventName,
        status: response.status,
        hasIp: Boolean(forwardedFor),
        hasUserAgent: Boolean(userAgent),
      });
    }

    if (!response.ok) {
      const responseBody = await response.text();
      reportError(new Error(`Plausible rejected event: ${response.status}`), {
        context: "pipe",
        eventName,
        status: response.status,
        responseBody: responseBody.slice(0, 500),
        hasIp: Boolean(forwardedFor),
        hasUserAgent: Boolean(userAgent),
      });
    }

    const responseHeaders = new Headers({
      "Content-Type": response.headers.get("content-type") || "text/plain",
    });
    if (dropped) {
      responseHeaders.set("x-plausible-dropped", "1");
    }

    if (dropped || !response.ok) {
      ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    reportError(error, {
      context: "pipe",
      eventName,
      hasIp: Boolean(forwardedFor),
      hasUserAgent: Boolean(userAgent),
    });

    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response("", { status: 502 });
  }
};
