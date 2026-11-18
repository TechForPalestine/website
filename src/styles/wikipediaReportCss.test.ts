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

interface CssRule {
  selector: string;
  body: string;
  /** Enclosing @media preludes, outermost first. */
  media: string[];
}

/** Flat list of style rules with their enclosing @media queries (comments stripped). */
function cssRules(source: string): CssRule[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: CssRule[] = [];
  const stack: { prelude: string; start: number }[] = [];
  let preludeStart = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "{") {
      stack.push({ prelude: text.slice(preludeStart, i).trim(), start: i + 1 });
      preludeStart = i + 1;
    } else if (char === "}") {
      const block = stack.pop();
      if (block && !block.prelude.startsWith("@")) {
        rules.push({
          selector: block.prelude,
          body: text.slice(block.start, i),
          media: stack.map((outer) => outer.prelude).filter((p) => p.startsWith("@media")),
        });
      }
      preludeStart = i + 1;
    } else if (char === ";") {
      preludeStart = i + 1;
    }
  }
  return rules;
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

describe("wikipedia-report.css reader layout in print", () => {
  it("drops the md: grid so the article does not print in the rail column", () => {
    const print = extractPrintBlock(css);
    const body = ruleBody(print, /\[data-report-layout\]\s*(?=\{)/);
    expect(body).toBeDefined();
    expect(body).toMatch(/display\s*:\s*block\s*!important/);
  });

  it("applies the hidden-rail layout rules to screens only", () => {
    // Every rule using [data-sidebar-hidden] as a state (not inside :not())
    // must sit inside an @media whose query names `screen`.
    const rules = cssRules(css).filter((rule) =>
      /\[data-sidebar-hidden\]/.test(rule.selector.replace(/:not\([^)]*\)/g, ""))
    );
    expect(rules.length).toBeGreaterThan(0);
    const offending = rules.filter((rule) => !rule.media.some((q) => /\bscreen\b/.test(q)));
    expect(offending.map((rule) => rule.selector)).toEqual([]);
  });
});

describe("wikipedia-report.css reader motion", () => {
  const MOTION = /(^|;|\s)(transition|animation|scroll-behavior)\s*:/;
  const noPreference = (rule: CssRule) =>
    rule.media.some((q) => /prefers-reduced-motion\s*:\s*no-preference/.test(q));

  it("guards every reader-chrome transition and animation behind no-preference", () => {
    const READER_CHROME =
      /data-report-smooth|data-flip|data-sidebar-leaving|data-sidebar-animate|data-toc-children|report-toc-toggle|report-sidebar-show|report-drawer|data-report-layout/;
    const rules = cssRules(css).filter(
      (rule) => READER_CHROME.test(rule.selector) && MOTION.test(rule.body)
    );
    // The FLIP, rail, show-button, group and drawer motion are all present...
    for (const hook of [
      "data-flip",
      "data-sidebar-leaving",
      "data-sidebar-animate",
      "data-toc-children",
      "report-sidebar-show",
    ]) {
      expect(
        rules.some((rule) => rule.selector.includes(hook)),
        hook
      ).toBe(true);
    }
    // ...and none of it runs for readers who asked for reduced motion.
    expect(rules.filter((rule) => !noPreference(rule)).map((rule) => rule.selector)).toEqual([]);
  });

  it("only turns on smooth scrolling inside a no-preference guard, opted in by JS", () => {
    const smooth = cssRules(css).filter((rule) => /scroll-behavior\s*:\s*smooth/.test(rule.body));
    expect(smooth.length).toBeGreaterThan(0);
    for (const rule of smooth) {
      expect(noPreference(rule), rule.selector).toBe(true);
      // Never on before JS: hash URLs, back/forward and no-JS clicks stay instant.
      expect(rule.selector).toBe("html[data-report-smooth]");
    }
  });

  it("clips sideways overflow while the article is mid-FLIP", () => {
    const rule = cssRules(css).find((r) => r.selector === "[data-report-layout][data-flip]");
    expect(rule?.body).toMatch(/overflow-x\s*:\s*clip/);
  });

  it("registers the FLIP custom properties as non-inherited lengths", () => {
    for (const name of ["--rp-flip-x", "--rp-rail-top", "--rp-rail-left", "--rp-rail-width"]) {
      const block = css.match(new RegExp(`@property\\s+${name}\\s*\\{([^}]*)\\}`))?.[1];
      expect(block, name).toBeDefined();
      expect(block, name).toMatch(/inherits\s*:\s*false/);
      expect(block, name).toMatch(/syntax\s*:\s*"<length>"/);
    }
  });
});

describe("wikipedia-report.css quote captions", () => {
  it("styles the caption under a grouped quote", () => {
    const body = ruleBody(css, /\.report-prose\s+figure\.report-quote\s*>\s*figcaption/);
    expect(body).toBeDefined();
    // Doc layout: deeper indent than the quote text, hanging after the dash.
    expect(body).toMatch(/padding-inline\s*:/);
    expect(body).toMatch(/text-indent\s*:\s*-/);
  });
});
