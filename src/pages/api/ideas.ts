import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { fetchNotionIdeas } from "../../store/notionClient.js";
import { reportError } from "../../lib/report-error";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.runtime?.ctx;
  try {
    const ideas = await fetchNotionIdeas(locals);

    return new Response(JSON.stringify(ideas), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    reportError(error, { context: "ideas" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch ideas" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
