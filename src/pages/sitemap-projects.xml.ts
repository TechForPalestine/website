import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../lib/report-error";
import { fetchProjectsData } from "../store/projectsClient";
import { buildProjectsSitemap } from "../utils/projectsSitemap";

// The ~90 /projects/<slug> URLs are server-rendered, so @astrojs/sitemap
// cannot see them. This lists them from the same cached ProjectHub data the
// pages use, so a new project appears without a deploy. Referenced from
// sitemap-index.xml (astro.config.mjs) and robots.txt.
//
// It must not live under /api/: the middleware forces no-store there.

export const prerender = false;

const FALLBACK_ORIGIN = "https://techforpalestine.org";
const SUCCESS_CACHE = "public, max-age=3600, s-maxage=3600";
const RETRY_AFTER_SECONDS = "300";

// A 200 with an empty <urlset> tells Google the projects are gone, so any
// failure or empty list is a 503 that crawlers retry rather than believe.
function unavailable(): Response {
  return new Response("Project sitemap temporarily unavailable", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Retry-After": RETRY_AFTER_SECONDS,
      "Cache-Control": "no-store",
    },
  });
}

export const GET: APIRoute = async ({ locals, site }) => {
  const ctx = locals.runtime?.ctx;
  try {
    const { projects } = await fetchProjectsData(locals);
    if (projects.length === 0) return unavailable();

    return new Response(buildProjectsSitemap(projects, site?.origin ?? FALLBACK_ORIGIN), {
      status: 200,
      headers: {
        // Explicit: a bare Response defaults to text/plain.
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": SUCCESS_CACHE,
      },
    });
  } catch (error) {
    reportError(error, { context: "projects-sitemap" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
    return unavailable();
  }
};
