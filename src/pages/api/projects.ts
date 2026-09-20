import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../../lib/report-error";
import { fetchProjectsData } from "../../store/projectsClient";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.runtime?.ctx;
  try {
    const { projects, tags } = await fetchProjectsData(locals);

    return new Response(JSON.stringify({ projects, tags }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        // Comprehensive cache control headers
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
        // Cloudflare-specific headers
        "CF-Cache-Status": "DYNAMIC",
        Vary: "*",
        // Custom headers for debugging
        "X-Project-Count": projects.length.toString(),
        "X-Tag-Count": tags.length.toString(),
        "X-Fetch-Time": new Date().toISOString(),
        "X-Cache-Bust": Date.now().toString(),
      },
    });
  } catch (error) {
    reportError(error, { context: "projects" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
