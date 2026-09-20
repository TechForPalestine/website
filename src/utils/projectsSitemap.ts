import type { ProjectItem } from "../components/projects/projectData";
import { projectPath } from "./projectSlug";

// Builds the XML for /sitemap-projects.xml. Pure, so it can be checked without
// a server. Emits projectPath() with no trailing slash: that is the canonical
// URL the slug route 301s to, and a sitemap that disagrees with a page's
// canonical gets ignored.

type SitemapProject = Pick<ProjectItem, "id" | "name" | "updatedAt">;

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/** YYYY-MM-DD, or null when the value is missing or not a real date. */
export function toLastmod(value: string | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time).toISOString().slice(0, 10);
}

export function buildProjectsSitemap(projects: SitemapProject[], origin: string): string {
  const base = origin.replace(/\/+$/, "");
  const urls = [...projects]
    .sort((a, b) => a.id - b.id)
    .map((project) => {
      const lastmod = toLastmod(project.updatedAt);
      return [
        "  <url>",
        `    <loc>${escapeXml(`${base}${projectPath(project)}`)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
