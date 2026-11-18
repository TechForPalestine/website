import { describe, expect, it } from "vitest";
import {
  isEmptyParagraph,
  unwrapWholeLinkFormatting,
  buildDocumentIndex,
  cleanHeadingInlines,
  dropLeadingChars,
  headerText,
  normalizeTableHead,
  numberNotes,
  planHeadings,
  singleCellContent,
  stringify,
  transformPage,
} from "./ast.mjs";
import { extractCaptionTexts, normalizeCaption, splitIntoPages } from "./transform.mjs";

type Node = { t: string; c?: any };

/** Inline list from text: words become Str, spaces become Space. */
const text = (s: string): Node[] =>
  s
    .split(/( )/)
    .filter(Boolean)
    .map((w) => (w === " " ? { t: "Space" } : { t: "Str", c: w }));
const header = (level: number, s: string, id = ""): Node => ({
  t: "Header",
  c: [level, [id, [], []], text(s)],
});
const para = (...inlines: Node[]): Node => ({ t: "Para", c: inlines });
const note = (s: string): Node => ({ t: "Note", c: [para(...text(s))] });
const link = (s: string, url: string): Node => ({
  t: "Link",
  c: [["", [], []], [{ t: "Underline", c: text(s) }], [url, ""]],
});

function buildDoc(blocks: Node[]) {
  const doc = { blocks };
  const noteNumbers = numberNotes(blocks);
  const { pages } = splitIntoPages(blocks, headerText);
  const index = buildDocumentIndex(doc, pages);
  const warnings: string[] = [];
  const ctx = {
    index,
    noteNumbers,
    warn: (m: string) => warnings.push(m),
    image: (src: string) => ({ src: `/images/${src}`, alt: "", width: 10, height: 20 }),
  };
  return { pages, index, warnings, run: (i: number) => transformPage(pages[i], ctx) };
}

const html = (blocks: Node[]) => JSON.stringify(blocks);

describe("heading inlines", () => {
  it("strips bold wrappers and edge line breaks", () => {
    const cleaned = cleanHeadingInlines([
      { t: "LineBreak" },
      { t: "Strong", c: text("6.1.8: Claims") },
      { t: "Space" },
    ]);
    expect(stringify(cleaned)).toBe("6.1.8: Claims");
  });

  it("drops a prefix spanning several tokens", () => {
    expect(stringify(dropLeadingChars(text("6.3.2: Coordinated Editors"), 7))).toBe(
      "Coordinated Editors"
    );
    expect(dropLeadingChars([{ t: "Str", c: "6.1abc" }], 3)).toEqual([{ t: "Str", c: "abc" }]);
  });
});

describe("planHeadings", () => {
  const { pages } = buildDoc([
    header(1, "Section 6: The ADL report"),
    header(2, "6.1: Core Flaws"),
    header(3, ""),
    header(4, "6.3.4.5.4 Hamas edits"),
    header(6, "Lengthy discussion"),
    header(2, "6.3.4.5.1 Samir Kuntar"),
  ]);

  it("derives level and id from the numbering, not the docx level", () => {
    const entries = [...planHeadings(pages[0]).values()];
    expect(entries[0]).toMatchObject({ level: 2, id: "s6-1", number: "6.1", title: "Core Flaws" });
    expect(entries[1]).toBeNull(); // empty heading dropped
    expect(entries[2]).toMatchObject({ level: 4, id: "s6-3-4-5-4" });
    expect(entries[3]).toMatchObject({
      level: 4,
      id: "s6-3-4-5-4-lengthy-discussion",
      title: "Lengthy discussion",
    });
    expect(entries[4]).toMatchObject({ level: 4, id: "s6-3-4-5-1" });
    expect(stringify(entries[0]?.inlines ?? [])).toBe("6.1 Core Flaws");
  });
});

describe("transformPage", () => {
  const doc = buildDoc([
    para(...text("Embargoed"), note("draft note")),
    header(1, "Executive Summary", "executive-summary"),
    para(...text("See"), { t: "Space" }, link("Section 6.1", "#core"), note("first")),
    header(2, "Our Claims in Brief"),
    header(1, "Section 6: The ADL report", "section-6-the-adl-report"),
    header(2, "6.1: Core Flaws", "core"),
    para(
      ...text("Claim"),
      note("second"),
      { t: "Space" },
      link("6.1", "#_broken"),
      { t: "Space" },
      link("back", "#section-6-the-adl-report")
    ),
    para(
      { t: "Image", c: [["", [], []], [], ["media/a.png", ""]] },
      { t: "Space" },
      ...text("after")
    ),
  ]);

  it("numbers notes over the whole document, including dropped draft matter", () => {
    const front = doc.run(0);
    expect(front.notes.map((n: { n: number }) => n.n)).toEqual([2]);
    expect(html(front.blocks)).toContain(
      '<sup class=\\"fn-ref\\"><a href=\\"#fn-2\\" id=\\"fnref-2\\">2</a></sup>'
    );
    expect(doc.run(1).notes.map((n: { n: number }) => n.n)).toEqual([3]);
  });

  it("remaps internal links to contract hrefs and drops underline styling", () => {
    const out = html(doc.run(0).blocks);
    expect(out).toContain('"/wikipedia-report-2026/section-6#s6-1"');
    expect(out).not.toContain("Underline");
    const section = html(doc.run(1).blocks);
    expect(section).toContain('"/wikipedia-report-2026/section-6"');
    expect(doc.warnings.some((w) => w.includes("#_broken"))).toBe(true); // resolved from link text
  });

  it("builds the toc and renders headings and figures as raw HTML", () => {
    const front = doc.run(0);
    expect(front.toc).toEqual([{ title: "Our Claims in Brief", depth: 2, id: "claims-in-brief" }]);
    const section = doc.run(1);
    expect(section.toc).toEqual([{ number: "6.1", title: "Core Flaws", depth: 2, id: "s6-1" }]);
    const out = html(section.blocks);
    expect(out).toContain('<h2 id=\\"s6-1\\">');
    expect(out).toContain(
      '<figure class=\\"report-figure\\"><img src=\\"/images/media/a.png\\" alt=\\"\\" width=\\"10\\" height=\\"20\\"'
    );
    expect(section.blocks.at(-1)).toEqual({ t: "Para", c: [{ t: "Str", c: "after" }] });
  });
});

describe("omitted images", () => {
  it("removes the whole figure when the image callback returns null", () => {
    const blocks = [
      header(1, "Executive Summary", "executive-summary"),
      para(
        ...text("before"),
        { t: "Image", c: [["", [], []], [], ["media/skip.png", ""]] },
        { t: "Image", c: [["", [], []], [], ["media/keep.png", ""]] }
      ),
      para({ t: "Image", c: [["", [], []], [], ["media/skip.png", ""]] }),
    ];
    const { pages } = splitIntoPages(blocks, headerText);
    const base = buildDoc(blocks);
    const ctx = {
      index: base.index,
      noteNumbers: numberNotes(blocks),
      warn: () => {},
      image: (src: string) =>
        src.includes("skip") ? null : { src: `/images/${src}`, alt: "", width: 10, height: 20 },
    };
    const out = html(transformPage(pages[0], ctx).blocks);
    expect(out).not.toContain("skip");
    expect(out.match(/<figure/g)).toHaveLength(1);
    expect(out).toContain("keep.png");
  });
});

describe("quote captions", () => {
  const quoteOf = (...blocks: Node[]): Node => ({ t: "BlockQuote", c: blocks });
  const render = (blocks: Node[], captionTexts: string[]) => {
    const all = [header(1, "Executive Summary", "executive-summary"), ...blocks];
    const { pages } = splitIntoPages(all, headerText);
    const base = buildDoc(all);
    const ctx = {
      index: base.index,
      noteNumbers: numberNotes(all),
      warn: () => {},
      captions: new Set(captionTexts.map(normalizeCaption)),
      image: (src: string) => ({ src: `/images/${src}`, alt: "", width: 10, height: 20 }),
    };
    return (transformPage(pages[0], ctx).blocks as Node[])
      .map((b) =>
        b.t === "RawBlock"
          ? b.c[1]
          : b.t === "Plain" || b.t === "Para"
            ? `[${b.t}:${stringify(b.c)}${b.c.some((n: Node) => n.t === "RawInline" && n.c[1].includes("fn-ref")) ? "+note" : ""}]`
            : b.t
      )
      .join("");
  };
  const q = (s: string) => para(...text(s));

  it("groups quotes with their caption, em dash and footnote kept", () => {
    const out = render(
      [
        quoteOf(
          q("“One quote.”"),
          q("“Second quote.”"),
          para(...text("- Dr. Klein"), note("source"), ...text(" (selected quotes)"))
        ),
      ],
      ["- Dr. Klein (selected quotes)"]
    );
    expect(out).toBe(
      '<figure class="report-quote"><blockquote>[Para:“One quote.”]</blockquote>' +
        "<blockquote>[Para:“Second quote.”]</blockquote><figcaption>" +
        "[Plain:— Dr. Klein (selected quotes)+note]</figcaption></figure>"
    );
  });

  it("makes one figure per quote and caption pair; captions without a dash are left as is", () => {
    const out = render(
      [quoteOf(q("“A.”"), q("Tandem, page 10"), q("“B.”"), q("Tandem, page 12"))],
      ["Tandem, page 10", "Tandem, page 12"]
    );
    expect(out.match(/<figure class="report-quote">/g)).toHaveLength(2);
    expect(out).toContain("[Plain:Tandem, page 10]");
    expect(out).toContain("[Plain:Tandem, page 12]");
    expect(out).not.toContain("—");
  });

  it("keeps a continuation paragraph without an opening quote mark in the same blockquote", () => {
    const out = render([quoteOf(q("“First part."), q("Second part.”"), q("- Cap"))], ["- Cap"]);
    expect(out.match(/<blockquote>/g)).toHaveLength(1);
    expect(out).toContain("[Para:“First part.][Para:Second part.”]</blockquote>");
  });

  it("keeps paragraphs that open with a quote mark in one quote until the previous one closed", () => {
    const out = render(
      [quoteOf(q("“First part, still open."), q("“Second part closes.”"), q("“New quote.”"))],
      []
    );
    expect(out.match(/<blockquote>/g)).toHaveLength(2);
    expect(out).toContain(
      "<blockquote>[Para:“First part, still open.][Para:“Second part closes.”]</blockquote><blockquote>[Para:“New quote.”]</blockquote>"
    );
  });

  it("emits a quote without a caption as a bare blockquote", () => {
    const out = render([quoteOf(q("“Alone.”"))], []);
    expect(out).toBe("<blockquote>[Para:“Alone.”]</blockquote>");
  });

  it("splits quotes merged by a double line break", () => {
    const out = render(
      [
        quoteOf(
          para(...text("“One.”"), { t: "LineBreak" }, { t: "LineBreak" }, ...text("“Two.”")),
          q("- Cap")
        ),
      ],
      ["- Cap"]
    );
    expect(out.match(/<blockquote>/g)).toHaveLength(2);
    expect(out).toContain("[Para:“One.”]</blockquote><blockquote>[Para:“Two.”]");
  });

  it("unwraps an image-only blockquote", () => {
    const image = para({ t: "Image", c: [["", [], []], [], ["media/a.png", ""]] });
    const out = render([quoteOf(q("“Before.”"), image)], []);
    expect(out).toContain("</blockquote>");
    expect(out).toMatch(/<\/blockquote><figure class="report-figure">/);
    const only = render([quoteOf(image)], []);
    expect(only).not.toContain("blockquote");
    expect(only).toContain("report-figure");
  });

  it("treats a one-item list right after a quote as its caption", () => {
    const list: Node = { t: "BulletList", c: [[{ t: "Plain", c: text("Letter from Comer") }]] };
    const out = render([quoteOf(q("“Q.”")), list], ["Letter from Comer"]);
    expect(out).toContain("<figcaption>[Plain:Letter from Comer]</figcaption>");
  });
});

describe("extractCaptionTexts", () => {
  const p = (left: number | null, t: string, extra = "") =>
    `<w:p><w:pPr>${left === null ? "" : `<w:ind w:left="${left}"${extra}/>`}</w:pPr><w:r><w:t>${t}</w:t></w:r></w:p>`;

  it("collects 1440 paragraphs that follow a 720 quote, not other 1440 paragraphs", () => {
    const xml = [
      p(1440, "bullet before any quote"),
      p(720, "“quote”"),
      p(1440, "- caption &amp; more"),
      p(null, "body"),
      p(1440, "bullet after body"),
    ].join("");
    const { texts, count } = extractCaptionTexts(xml);
    expect(count).toBe(1);
    expect(texts).toEqual(new Set([normalizeCaption("- caption & more")]));
  });

  it("treats left 720 + firstLine 720 as a caption indent, and lists skipped indents", () => {
    const xml = [
      p(720, "“quote”"),
      p(720, "- first-line caption", ' w:firstLine="720"'),
      p(720, "“quote 2”"),
      p(1080, "odd indent after quote"),
      p(0, "body"),
    ].join("");
    const { texts, count, skipped } = extractCaptionTexts(xml);
    expect(count).toBe(1);
    expect(texts).toEqual(new Set([normalizeCaption("- first-line caption")]));
    expect(skipped).toEqual(["odd indent after quote"]);
  });
});

describe("tables", () => {
  const cell = (s: string) => [
    ["", [], []],
    { t: "AlignDefault" },
    1,
    1,
    [{ t: "Plain", c: text(s) }],
  ];
  const row = (...cells: string[]) => [["", [], []], cells.map(cell)];
  const table = (headRows: unknown[], bodyRows: unknown[]) => ({
    t: "Table",
    c: [
      ["", [], []],
      [null, []],
      [],
      [["", [], []], headRows],
      [[["", [], []], 0, [], bodyRows]],
      [["", [], []], []],
    ],
  });

  it("keeps only the first header row in the head", () => {
    const t = normalizeTableHead(
      table([row("A", "B"), row("1", "2"), row("3", "4")], [row("5", "6")])
    );
    expect(t.c[3][1]).toHaveLength(1);
    expect(t.c[4][0][3].map((r: any) => stringify(r))).toEqual(["12", "34", "56"]);
  });

  it("detects single-cell layout tables", () => {
    expect(stringify(singleCellContent(table([row("only")], [])))).toBe("only");
    expect(singleCellContent(table([row("a", "b")], []))).toBeNull();
  });
});

describe("cleanup", () => {
  it("detects empty paragraphs", () => {
    expect(isEmptyParagraph([{ t: "Space" }, { t: "Str", c: "\u00a0" }, { t: "LineBreak" }])).toBe(
      true
    );
    expect(isEmptyParagraph([{ t: "Strong", c: [{ t: "Space" }] }])).toBe(true);
    expect(isEmptyParagraph(text("x"))).toBe(false);
    expect(isEmptyParagraph([note("n")])).toBe(false);
  });

  it("unwraps formatting only when it wraps the whole link text", () => {
    const whole = [{ t: "Strong", c: [{ t: "Underline", c: text("Section 6.3") }] }];
    expect(unwrapWholeLinkFormatting(whole)).toEqual(text("Section 6.3"));
    const partial = [{ t: "Strong", c: text("Section") }, { t: "Space" }, { t: "Str", c: "6.3" }];
    expect(unwrapWholeLinkFormatting(partial)).toBe(partial);
  });
});
