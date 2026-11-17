import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  FINDINGS,
  METHODOLOGY_NOTES,
  METHODOLOGY_TRACKS,
  RELATED_PROJECTS,
  findingHref,
  findingLinkLabel,
  pdfMeta,
  type ReportFinding,
} from "./wikipediaReport";

const base: ReportFinding = {
  id: "f",
  title: "T",
  body: "B",
  section: "6.3",
  sectionTitle: "S",
};

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

// Guards for new report versions: section numbers move when the report is
// revised, and the landing page links into it by number.
const CONTENT_DIR = "src/content/wikipedia-report";

function reportPage(slug: string): string | undefined {
  const file = `${CONTENT_DIR}/${slug}.md`;
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

/** The heading text for a section number, from the converter's frontmatter. */
function sectionTitle(number: string): string | undefined {
  const page = reportPage(`section-${number.split(".")[0]}`);
  if (!page) return undefined;
  if (!number.includes(".")) return /^title: "((?:[^"\\]|\\.)*)"$/m.exec(page)?.[1];
  // Read every toc entry and compare numbers as strings (no regex built from input).
  const entries = page.matchAll(/number: "([\d.]+)", title: "((?:[^"\\]|\\.)*)"/g);
  return [...entries].find(([, n]) => n === number)?.[2];
}

describe("links from the landing page into the report", () => {
  it("point each finding at the section it describes", () => {
    for (const f of FINDINGS) {
      expect(sectionTitle(f.section), `${f.id} → Section ${f.section}`).toBe(f.sectionTitle);
    }
  });

  it("all resolve to an existing page and heading", () => {
    const hrefs = [
      ...FINDINGS.map(findingHref),
      ...METHODOLOGY_TRACKS.map((t) => t.ref.href),
      ...METHODOLOGY_NOTES.flatMap((n) => (n.ref ? [n.ref.href] : [])),
    ];
    for (const href of hrefs) {
      const [path, hash] = href.split("#");
      const page = reportPage(path.split("/").pop() ?? "");
      expect(page, href).toBeDefined();
      if (hash) expect(page?.includes(`id="${hash}"`), href).toBe(true);
    }
  });
});
