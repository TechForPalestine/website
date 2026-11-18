import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest runs from the repo root, so this path is stable.
const css = readFileSync(resolve(process.cwd(), "src/styles/wikipedia-report.css"), "utf8");

/** Returns the body of the (single) @media print block, brace-matched. */
function extractPrintBlock(source: string): string {
  const matches = source.match(/@media\s+print\s*\{/g) ?? [];
  expect(matches).toHaveLength(1);

  const start = source.search(/@media\s+print\s*\{/);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error("Unterminated @media print block");
}

/** Returns the declaration body of the first rule whose selector matches. */
function ruleBody(source: string, selector: RegExp): string | undefined {
  const pattern = new RegExp(`${selector.source}[^{}]*\\{([^}]*)\\}`, "m");
  return source.match(pattern)?.[1];
}

const LIST_SELECTORS = [
  String.raw`\.report-prose\s*>\s*table`,
  String.raw`\.report-prose\s*>\s*figure`,
  String.raw`\.report-prose\s*>\s*ol`,
  String.raw`\.report-prose\s*>\s*ul`,
  String.raw`\.report-prose\s*>\s*\.report-notes`,
];

describe("wikipedia-report.css content-visibility", () => {
  it("skips rendering off-screen .report-cv sections with a length placeholder", () => {
    const body = ruleBody(css, /\.report-cv\s*(?=[,{\s])/);
    expect(body).toBeDefined();
    expect(body).toMatch(/content-visibility\s*:\s*auto/);
    expect(body).toMatch(/contain-intrinsic-size\s*:\s*auto\s+\d+px/);
  });

  it("applies content-visibility to large prose blocks (tables, figures, lists)", () => {
    for (const selector of LIST_SELECTORS) {
      const body = ruleBody(css, new RegExp(selector));
      expect(body, selector).toBeDefined();
      expect(body, selector).toMatch(/content-visibility\s*:\s*auto/);
      expect(body, selector).toMatch(/contain-intrinsic-size\s*:\s*auto\s+\d+px/);
    }
  });

  it("offsets .report-cv anchors below the sticky nav", () => {
    const body = ruleBody(css, /\.report-cv\[id\]/);
    expect(body).toMatch(/scroll-margin-top\s*:\s*var\(--rp-anchor-offset/);
  });

  it("does not apply content-visibility to headings or paragraphs", () => {
    const rules = css.match(/[^{}]+\{[^}]*\}/g) ?? [];
    const offending = rules.filter(
      (rule) =>
        /content-visibility/.test(rule) && /(^|[\s,>])(h[2-4]|p)(\s|,|$|:)/.test(rule.split("{")[0])
    );
    expect(offending).toEqual([]);
  });

  it("forces content-visibility visible for .report-cv in print", () => {
    const print = extractPrintBlock(css);
    const body = ruleBody(print, /\.report-cv\s*(?=[,{\s])/);
    expect(body).toBeDefined();
    expect(body).toMatch(/content-visibility\s*:\s*visible/);
  });

  it("forces content-visibility visible for large prose blocks in print", () => {
    const print = extractPrintBlock(css);
    for (const selector of LIST_SELECTORS) {
      const body = ruleBody(print, new RegExp(selector));
      expect(body, selector).toBeDefined();
      expect(body, selector).toMatch(/content-visibility\s*:\s*visible/);
    }
  });
});

describe("wikipedia-report.css quote captions", () => {
  it("styles the caption under a grouped quote", () => {
    const body = ruleBody(css, /\.report-prose\s+figure\.report-quote\s*>\s*figcaption/);
    expect(body).toBeDefined();
    expect(body).toMatch(/color\s*:\s*var\(--rp-ink-secondary\)/);
  });
});
