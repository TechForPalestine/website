import { describe, expect, it } from "vitest";
import {
  FINDINGS,
  REPORT_PDF,
  findingHref,
  findingLinkLabel,
  pdfMeta,
  type ReportFinding,
} from "./wikipediaReport";

const base: ReportFinding = { id: "f", title: "T", body: "B", section: "6.3" };

describe("findingHref", () => {
  it("links to the PDF without an anchor when the page is unknown", () => {
    expect(findingHref(base)).toBe(REPORT_PDF.href);
  });

  it("jumps to the section's page when known", () => {
    expect(findingHref({ ...base, page: 41 })).toBe(`${REPORT_PDF.href}#page=41`);
  });
});

describe("findingLinkLabel", () => {
  it("names the section, adding the page number when known", () => {
    expect(findingLinkLabel(base)).toBe("Section 6.3");
    expect(findingLinkLabel({ ...base, page: 41 })).toBe("Section 6.3 (p. 41)");
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
