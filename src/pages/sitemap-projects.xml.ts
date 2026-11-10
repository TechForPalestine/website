import type { APIRoute } from "astro";
import { fetchProjectsData } from "../store/projectsClient";
import { projectSitemapEntries, sitemapXml } from "../utils/seo";

export const prerender = false;

/**
 * Every /projects/<slug>-<id> page. @astrojs/sitemap only sees static routes,
 * and these come from ProjectHub at request time, so they get their own
 * sitemap, declared in public/robots.txt.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { projects } = await fetchProjectsData(locals);
    return new Response(sitemapXml(projectSitemapEntries(projects)), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[sitemap-projects] Could not load projects", error);
    // A 5xx tells crawlers to retry later; an empty urlset would tell them
    // every project page is gone.
    return new Response("Service unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
};
