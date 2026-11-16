import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FINDINGS,
  RELATED_PROJECTS,
  findingHref,
  findingLinkLabel,
  pdfMeta,
  type ReportFinding,
} from "./wikipediaReport";

const base: ReportFinding = { id: "f", title: "T", body: "B", section: "6.3" };

describe("findingHref", () => {
  it("links to the finding's section in the online report", () => {
    expect(findingHref(base)).toBe("/wikipedia-report-2026/section-6#s6-3");
    expect(findingHref({ ...base, section: "4" })).toBe("/wikipedia-report-2026/section-4");
  });
});

describe("findingLinkLabel", () => {
  it("names the section", () => {
    expect(findingLinkLabel(base)).toBe("Section 6.3");
  });
});

describe("pdfMeta", () => {
  it("drops parts that are not known yet", () => {
    expect(pdfMeta({ href: "/x.pdf" })).toBe("PDF");
    expect(pdfMeta({ href: "/x.pdf", size: "4.2 MB", pages: 64 })).toBe("PDF, 4.2 MB, 64 pages");
  });
});

describe("FINDINGS", () => {
  it("has unique anchor ids", () => {
    const ids = FINDINGS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("pairs every stat with a label", () => {
    for (const f of FINDINGS) expect(Boolean(f.stat)).toBe(Boolean(f.statLabel));
  });
});

describe("FINDINGS sections", () => {
  it("all resolve to online report links", () => {
    for (const f of FINDINGS) expect(() => findingHref(f)).not.toThrow();
  });
});

describe("RELATED_PROJECTS", () => {
  it("points every logo at a file in /public", () => {
    for (const project of RELATED_PROJECTS) {
      expect(existsSync(`public${project.logo}`), project.logo).toBe(true);
    }
  });
});
