import { readdirSync } from "node:fs";

/**
 * Sitemap URLs for the Wikipedia report: the landing page, the reader index
 * and one page per report section/appendix. The executive summary has no
 * reader page (it is the PDF), and the one-page full text is deliberately
 * never listed. Plain .mjs so astro.config.mjs can import it.
 *
 * @param {string} site Site origin, no trailing slash.
 * @param {string} contentDir Directory holding the report's *.md files.
 * @returns {string[]} Absolute URLs without trailing slashes.
 */
export function reportSitemapPages(site, contentDir) {
  const slugs = readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.slice(0, -".md".length))
    .filter((slug) => slug !== "executive-summary")
    .sort();
  return [
    `${site}/wikipedia-report`,
    `${site}/wikipedia-report-2026`,
    ...slugs.map((slug) => `${site}/wikipedia-report-2026/${slug}`),
  ];
}

/**
 * Sitemap URLs for the incubator guide's chapter pages. The overview
 * (/incubator/guide) is a static route the integration lists itself.
 *
 * @param {string} site Site origin, no trailing slash.
 * @param {string} contentDir Directory holding the guide's *.md files.
 * @returns {string[]} Absolute URLs without trailing slashes.
 */
export function guideSitemapPages(site, contentDir) {
  return readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => `${site}/incubator/guide/${file.slice(0, -".md".length)}`)
    .sort();
}
