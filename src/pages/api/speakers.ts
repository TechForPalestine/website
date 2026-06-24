import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { fetchNotionAgenda } from "../../store/notionClient";
import { reportError } from "../../lib/report-error";

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.runtime?.ctx;
  try {
    const data = await fetchNotionAgenda(locals);

    return new Response(JSON.stringify(data), {
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
    reportError(error, { context: "speakers" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch agenda and speakers" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
