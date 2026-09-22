import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../../lib/report-error";
import { fetchProjectsData } from "../../store/projectsClient";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.cfContext;
  try {
    const { projects, tags, source } = await fetchProjectsData(locals);

    return new Response(JSON.stringify({ projects, tags }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        // The list is cached server-side (see store/projectsClient.ts); browsers
        // still revalidate. The middleware forces no-store on /api/* regardless.
        "Cache-Control": "no-store",
        // hit | miss | stale: how you can tell the server-side cache is working.
        "X-Projects-Source": source,
        "X-Project-Count": projects.length.toString(),
        "X-Tag-Count": tags.length.toString(),
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
