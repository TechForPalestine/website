import { describe, expect, it } from "vitest";
import * as contract from "../../src/utils/wikipediaReportLinks";
import {
  REPORT_BASE_PATH,
  appendixHref,
  checkNumbering,
  collapseBlankLines,
  footnoteRefHtml,
  frontmatter,
  headingLevel,
  headingPrefixLength,
  imageSize,
  linkCrossReferences,
  notesSectionHtml,
  parseHeading,
  sanitizeHtml,
  sectionAnchorId,
  sectionHref,
  slugify,
  splitIntoPages,
  verifyPages,
} from "./transform.mjs";

describe("URL contract port", () => {
  it("matches src/utils/wikipediaReportLinks.ts exactly", () => {
    expect(REPORT_BASE_PATH).toBe(contract.REPORT_BASE_PATH);
    for (const n of ["1", "6", "6.3", "6.3.2", "6.3.4.5.1"]) {
      expect(sectionAnchorId(n)).toBe(contract.sectionAnchorId(n));
      expect(sectionHref(n)).toBe(contract.sectionHref(n));
    }
    for (const l of ["A", "E", "F"]) expect(appendixHref(l)).toBe(contract.appendixHref(l));
    expect(() => sectionAnchorId("6.")).toThrow();
    expect(() => appendixHref("e")).toThrow();
  });
});

describe("parseHeading", () => {
  it("recognises page headings", () => {
    expect(parseHeading("Section 6: The ADL report")).toEqual({
      kind: "section",
      number: "6",
      title: "The ADL report",
    });
    expect(parseHeading("Appendix E: Full Counts of deletion votes")).toEqual({
      kind: "appendix",
      letter: "E",
      title: "Full Counts of deletion votes",
    });
  });

  it("parses numbered headings with or without a colon and stray whitespace", () => {
    expect(parseHeading("6.1: The Reports’ Core Flaws")).toEqual({
      kind: "numbered",
      number: "6.1",
      title: "The Reports’ Core Flaws",
    });
    expect(parseHeading("6.1.1 The invented group")).toMatchObject({
      number: "6.1.1",
      title: "The invented group",
    });
    expect(parseHeading("  2.3.2.2:  Labeling  criticism ")).toMatchObject({
      number: "2.3.2.2",
      title: "Labeling criticism",
    });
  });

  it("treats blank headings as empty and others as plain", () => {
    expect(parseHeading("  ")).toEqual({ kind: "empty" });
    expect(parseHeading("Lengthy discussion")).toEqual({
      kind: "plain",
      title: "Lengthy discussion",
    });
    expect(parseHeading("4IL (2024–ongoing)")).toEqual({
      kind: "plain",
      title: "4IL (2024–ongoing)",
    });
  });
});

describe("heading helpers", () => {
  it("maps numbering depth to h2–h4, capped", () => {
    expect(headingLevel("6.1")).toBe(2);
    expect(headingLevel("6.1.1")).toBe(3);
    expect(headingLevel("6.3.4.5")).toBe(4);
    expect(headingLevel("6.3.4.5.1")).toBe(4);
  });

  it("measures the number prefix", () => {
    expect(headingPrefixLength("6.3.2: Coordinated")).toBe(7);
    expect(headingPrefixLength(" 4.5.3 NPOV")).toBe(7);
    expect(headingPrefixLength("Section 6: The ADL")).toBe(11);
    expect(headingPrefixLength("Lengthy discussion")).toBe(0);
  });

  it("slugifies and truncates on word boundaries", () => {
    expect(slugify("Our Claims in Brief")).toBe("our-claims-in-brief");
    expect(slugify("Adding “and terrorism”")).toBe("adding-and-terrorism");
    const long = slugify(
      "Articles from Table 1 in the ADL report, labeled as “Notable articles multiple bad-faith editors”"
    );
    expect(long.length).toBeLessThanOrEqual(48);
    expect(long).toBe("articles-from-table-1-in-the-adl-report-labeled");
  });

  it("flags gaps and orphans in numbering", () => {
    expect(checkNumbering("6", ["6.1", "6.1.1", "6.2"])).toEqual([]);
    expect(checkNumbering("6", ["6.1", "6.3"])).toEqual(["6.3: expected 6.2"]);
    expect(checkNumbering("6", ["6.5", "6.5.4", "6.5.4.2.2.1"])).toContain(
      "6.5.4.2.2.1: parent 6.5.4.2.2 has no heading"
    );
  });
});

describe("splitIntoPages (draft-matter stripping)", () => {
  const h = (text: string) => ({ heading: text });
  const p = (text: string) => ({ para: text });
  const blocks = [
    p("Embargoed til Nov 17"),
    h("TODO list"),
    p("cover"),
    h(""),
    h("Executive Summary"),
    p("summary"),
    h("Our Claims in Brief"),
    p("claims"),
    h("About this Report"),
    p("about"),
    h("About Tech for Palestine"),
    p("t4p"),
    h(""),
    h("Table of Contents"),
    p("toc line"),
    h(""),
    h("Section 1: Introduction"),
    p("intro"),
    h("1.1: Structure"),
    h("Appendix A: Zionism References"),
    p("refs"),
  ];
  const { pages, dropped } = splitIntoPages(blocks, (b) => ("heading" in b ? b.heading : null));

  it("drops everything before the executive summary, the TOC and About T4P", () => {
    expect(pages.map((pg) => pg.slug)).toEqual(["executive-summary", "section-1", "appendix-a"]);
    const all = JSON.stringify(pages);
    for (const gone of ["Embargoed", "cover", "t4p", "toc line", "TODO list"])
      expect(all).not.toContain(gone);
    expect(dropped).toEqual(["TODO list", "About Tech for Palestine", "Table of Contents"]);
  });

  it("keeps front sub-sections and builds page metadata", () => {
    expect(pages[0].blocks.map((b) => ("para" in b ? b.para : b.heading))).toEqual([
      "summary",
      "Our Claims in Brief",
      "claims",
      "About this Report",
      "about",
    ]);
    expect(pages[1]).toMatchObject({
      kind: "section",
      label: "Section 1",
      title: "Introduction",
      order: 1,
    });
    expect(pages[2]).toMatchObject({
      kind: "appendix",
      label: "Appendix A",
      title: "Zionism References",
      order: 101,
    });
  });
});

describe("footnotes", () => {
  it("keeps the original number and suffixes repeat references", () => {
    expect(footnoteRefHtml(12)).toBe(
      '<sup class="fn-ref"><a href="#fn-12" id="fnref-12">12</a></sup>'
    );
    expect(footnoteRefHtml(12, 2)).toContain('id="fnref-12-2"');
  });

  it("renders a notes section with original numbering and back-links inside the paragraph", () => {
    const html = notesSectionHtml([
      { n: 7, html: "<p>First.</p>" },
      { n: 12, html: "<p>A</p>\n<blockquote>B</blockquote>" },
    ]);
    expect(html).toContain(
      '<li id="fn-7" value="7"><p>First. <a href="#fnref-7" class="fn-back" aria-label="Back to reference 7">↩\uFE0E</a></p></li>'
    );
    expect(html).toContain('<blockquote>B</blockquote> <a href="#fnref-12"');
    expect(html).toMatch(
      /^<section class="report-notes" aria-labelledby="notes-heading">\n<h2 id="notes-heading">Notes<\/h2>/
    );
    expect(notesSectionHtml([])).toBe("");
  });
});

describe("sanitizeHtml", () => {
  it("strips style and non-contract classes, keeps contract classes and dir", () => {
    const html =
      '<td style="text-align: center;" class="odd"><span class="mark">x</span><span dir="rtl">ي</span><sup class="fn-ref">1</sup></td>';
    expect(sanitizeHtml(html)).toBe(
      '<td>x<span dir="rtl">ي</span><sup class="fn-ref">1</sup></td>'
    );
  });

  it("drops colgroups and adds rel to external links only", () => {
    const html =
      '<table><colgroup><col style="width: 50%" /></colgroup><tr><td><a href="https://x.org" class="uri">x</a> <a href="#fn-1">1</a></td></tr></table>';
    expect(sanitizeHtml(html)).toBe(
      '<table><tr><td><a href="https://x.org" rel="noopener noreferrer">x</a> <a href="#fn-1">1</a></td></tr></table>'
    );
  });

  it("collapses blank lines", () => {
    expect(collapseBlankLines("<p>a</p>\n\n  \n<p>b</p>\n")).toBe("<p>a</p>\n<p>b</p>");
  });
});

describe("linkCrossReferences", () => {
  const known = new Set(["2", "3", "4", "6", "6.1", "6.3", "6.4", "6.5", "4.5.2", "5.4"]);
  const resolve = {
    section: (n: string) => (known.has(n) ? sectionHref(n) : null),
    appendix: (l: string) => ("ABCDEF".includes(l) ? appendixHref(l) : null),
  };

  it("links single, parenthesised and listed references", () => {
    expect(linkCrossReferences("<p>(Section 4.5.2)</p>", resolve)).toBe(
      '<p>(<a href="/wikipedia-report-2026/section-4#s4-5-2">Section 4.5.2</a>)</p>'
    );
    expect(linkCrossReferences("<p>Sections 3 and 4.</p>", resolve)).toBe(
      '<p><a href="/wikipedia-report-2026/section-3">Sections 3</a> and <a href="/wikipedia-report-2026/section-4">4</a>.</p>'
    );
    expect(linkCrossReferences("in Sections 6.3, 6.4, and 6.5.", resolve)).toBe(
      'in <a href="/wikipedia-report-2026/section-6#s6-3">Sections 6.3</a>, <a href="/wikipedia-report-2026/section-6#s6-4">6.4</a>, and <a href="/wikipedia-report-2026/section-6#s6-5">6.5</a>.'
    );
    expect(linkCrossReferences("see Appendix E", resolve)).toBe(
      'see <a href="/wikipedia-report-2026/appendix-e">Appendix E</a>'
    );
  });

  it("leaves headings, existing links, unknown and external sections alone", () => {
    const log = { linked: [] as string[], unresolved: [] as string[], skipped: [] as string[] };
    const untouched = [
      '<h2 id="s6-1">6.1 Section 6.3 here</h2>',
      '<a href="#x">Section 6.3</a>',
      "Section 230 of the Communications Decency Act",
      "Board of Trustees, Section 4, which",
      "Universal Code of Conduct (section 3.2)",
    ];
    for (const html of untouched) expect(linkCrossReferences(html, resolve, log)).toBe(html);
    expect(log.unresolved).toEqual(["Section 230"]);
    expect(log.skipped).toEqual(["Section 4"]);
  });
});

describe("frontmatter", () => {
  it("emits the contract shape", () => {
    const yaml = frontmatter({
      slug: "section-6",
      kind: "section",
      label: "Section 6",
      title: "The ADL report",
      order: 6,
      toc: [{ number: "6.1", title: "The Reports’ Core Flaws", depth: 2, id: "s6-1" }],
    });
    expect(yaml).toBe(
      [
        "---",
        "slug: section-6",
        "kind: section",
        'label: "Section 6"',
        'title: "The ADL report"',
        "order: 6",
        "toc:",
        '  - { number: "6.1", title: "The Reports’ Core Flaws", depth: 2, id: "s6-1" }',
        "---",
      ].join("\n")
    );
    expect(
      frontmatter({ slug: "appendix-a", kind: "appendix", title: 'Say "hi"', order: 101, toc: [] })
    ).toContain('title: "Say \\"hi\\""\norder: 101\ntoc: []');
  });
});

describe("imageSize", () => {
  it("reads PNG and JPEG headers", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47], 0);
    new DataView(png.buffer).setUint32(16, 640);
    new DataView(png.buffer).setUint32(20, 480);
    expect(imageSize(png)).toEqual({ width: 640, height: 480 });

    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 17, 8, 0x01, 0xe0, 0x02, 0x80, 3, 0, 0,
    ]);
    expect(imageSize(jpeg)).toEqual({ width: 640, height: 480 });
    expect(imageSize(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("verifyPages", () => {
  it("passes a consistent set of pages", () => {
    const pages = [
      {
        slug: "section-6",
        html: '<h2 id="s6-1">6.1</h2><p>x<sup class="fn-ref"><a href="#fn-3" id="fnref-3">3</a></sup></p><ol><li id="fn-3" value="3">n</li></ol>',
      },
      {
        slug: "executive-summary",
        html: '<p><a href="/wikipedia-report-2026/section-6#s6-1">Section 6.1</a></p>',
      },
    ];
    expect(verifyPages(pages)).toEqual([]);
  });

  it("reports missing notes, duplicate ids, dangling links and inline styles", () => {
    const errors = verifyPages([
      {
        slug: "section-1",
        html: '<h2 id="a">x</h2><h3 id="a">y</h3><sup class="fn-ref"><a href="#fn-9" id="fnref-9">9</a></sup><a href="/wikipedia-report-2026/section-2#s2-1">x</a><p style="color:red">z</p>',
      },
    ]);
    expect(errors).toEqual(
      expect.arrayContaining([
        'section-1: duplicate id "a"',
        "section-1: note 9 referenced but not defined",
        'section-1: link to missing page "/wikipedia-report-2026/section-2#s2-1"',
        "section-1: forbidden markup (script, iframe, style or event handler)",
      ])
    );
  });
});
