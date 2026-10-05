import type { APIRoute } from "astro";
import { reportAndFlush } from "../../lib/report-error";
import { fetchProjectsData } from "../../store/projectsClient";

export const prerender = false;

// Public read-only data: CORS may be open (write endpoints must never do this).
const PUBLIC_READ_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { projects, tags, source } = await fetchProjectsData(locals);

    return new Response(JSON.stringify({ projects, tags }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...PUBLIC_READ_CORS,
        // Cache-Control is forced to no-store on /api/* by middleware/cache-control.ts.
        // hit | miss | stale: how you can tell the server-side cache is working.
        "X-Projects-Source": source,
        "X-Project-Count": projects.length.toString(),
        "X-Tag-Count": tags.length.toString(),
      },
    });
  } catch (error) {
    reportAndFlush(error, { context: "projects" }, locals);

    return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
