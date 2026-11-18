import { describe, expect, it } from "vitest";
import { reportSitemapPages } from "./reportSitemap.mjs";

const SITE = "https://techforpalestine.org";
const pages = reportSitemapPages(SITE, "src/content/wikipedia-report");

describe("reportSitemapPages", () => {
  it("lists the landing page, reader index and every section and appendix", () => {
    expect(pages).toContain(`${SITE}/wikipedia-report`);
    expect(pages).toContain(`${SITE}/wikipedia-report-2026`);
    expect(pages).toContain(`${SITE}/wikipedia-report-2026/section-6`);
    expect(pages).toContain(`${SITE}/wikipedia-report-2026/appendix-e`);
  });

  it("leaves out the executive summary and the one-page full text", () => {
    expect(pages.some((url) => url.endsWith("executive-summary"))).toBe(false);
    expect(pages.some((url) => url.endsWith("/full"))).toBe(false);
  });

  it("never uses trailing slashes", () => {
    expect(pages.some((url) => url.endsWith("/"))).toBe(false);
  });

  it("has two fixed pages plus twelve slugs", () => {
    expect(pages).toHaveLength(2 + 12);
  });
});
