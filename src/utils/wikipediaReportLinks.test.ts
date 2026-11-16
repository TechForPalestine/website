import { describe, expect, it } from "vitest";
import {
  appendixHref,
  sectionAnchorId,
  sectionHref,
  sectionPageSlug,
} from "./wikipediaReportLinks";

describe("wikipediaReportLinks", () => {
  it("builds prefixed anchor ids from section numbers", () => {
    expect(sectionAnchorId("6")).toBe("s6");
    expect(sectionAnchorId("6.3.2")).toBe("s6-3-2");
  });

  it("puts every subsection on its top-level section page", () => {
    expect(sectionPageSlug("6.3.4.5.1")).toBe("section-6");
  });

  it("links top-level sections without an anchor and subsections with one", () => {
    expect(sectionHref("3")).toBe("/wikipedia-report-2026/section-3");
    expect(sectionHref("4.5")).toBe("/wikipedia-report-2026/section-4#s4-5");
  });

  it("links appendices by lowercase letter", () => {
    expect(appendixHref("E")).toBe("/wikipedia-report-2026/appendix-e");
  });

  it("rejects malformed input", () => {
    expect(() => sectionHref("6.")).toThrow();
    expect(() => sectionHref("x")).toThrow();
    expect(() => appendixHref("e")).toThrow();
  });
});
