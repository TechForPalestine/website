import { describe, expect, it } from "vitest";
import { rewriteLinksForFullPage, scopeDuplicateIds, splitAtMapAnchor } from "./fullText";

const slugs = new Set(["executive-summary", "section-4", "section-6", "appendix-e"]);

describe("rewriteLinksForFullPage", () => {
  it("section anchor link becomes in-page anchor", () => {
    expect(
      rewriteLinksForFullPage('<a href="/wikipedia-report-2026/section-6#s6-3-2">x</a>', slugs)
    ).toBe('<a href="#s6-3-2">x</a>');
  });
  it("whole-entry link points at the entry section id", () => {
    expect(
      rewriteLinksForFullPage('<a href="/wikipedia-report-2026/appendix-e">x</a>', slugs)
    ).toBe('<a href="#appendix-e">x</a>');
  });
  it("bare index link points at the executive summary", () => {
    expect(rewriteLinksForFullPage('<a href="/wikipedia-report-2026">x</a>', slugs)).toBe(
      '<a href="#executive-summary">x</a>'
    );
  });
  it("unknown slug, external and plain anchors are untouched", () => {
    const html =
      '<a href="/wikipedia-report-2026/section-9#s9-1">a</a><a href="https://en.wikipedia.org/x">b</a><a href="#fn-91">c</a><a href="/wikipedia-report">d</a>';
    expect(rewriteLinksForFullPage(html, slugs)).toBe(html);
  });
  it("rewrites every occurrence", () => {
    const html =
      '<a href="/wikipedia-report-2026/section-4">a</a> <a href="/wikipedia-report-2026/section-4#s4-1">b</a>';
    expect(rewriteLinksForFullPage(html, slugs)).toBe(
      '<a href="#section-4">a</a> <a href="#s4-1">b</a>'
    );
  });
});

describe("splitAtMapAnchor", () => {
  it("splits before the claims heading", () => {
    expect(splitAtMapAnchor('<p>a</p><h2 id="claims-in-brief">C</h2>')).toEqual([
      "<p>a</p>",
      '<h2 id="claims-in-brief">C</h2>',
    ]);
    expect(splitAtMapAnchor("<p>a</p>")).toBeNull();
  });
});

describe("scopeDuplicateIds", () => {
  const html =
    '<section aria-labelledby="notes-heading"><h2 id="notes-heading">Notes</h2><a href="#notes-heading">n</a><h2 id="other">o</h2></section>';
  it("prefixes ids and their references with the slug", () => {
    expect(scopeDuplicateIds(html, "section-2", ["notes-heading"])).toBe(
      '<section aria-labelledby="section-2-notes-heading"><h2 id="section-2-notes-heading">Notes</h2><a href="#section-2-notes-heading">n</a><h2 id="other">o</h2></section>'
    );
  });
  it("leaves other ids alone", () => {
    expect(scopeDuplicateIds('<h2 id="other">o</h2>', "section-2", ["notes-heading"])).toBe(
      '<h2 id="other">o</h2>'
    );
  });
});
