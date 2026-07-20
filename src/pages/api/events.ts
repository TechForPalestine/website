import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { fetchEvents } from "../../store/eventsClient";
import { reportError } from "../../lib/report-error";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.runtime?.ctx;
  try {
    const events = await fetchEvents(locals);

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    reportError(error, { context: "events" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch events" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
