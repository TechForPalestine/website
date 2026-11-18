// Pure string/data transforms for the Wikipedia report converter.
// No I/O here: everything is unit-tested in transform.test.ts.

// --- URL contract --------------------------------------------------------
// Mirrors src/utils/wikipediaReportLinks.ts (the single source of truth for
// the URL scheme). A plain-Node script cannot import .ts, so the functions are
// ported here and transform.test.ts asserts both produce identical output.

export const REPORT_BASE_PATH = "/wikipedia-report-2026";

const SECTION_RE = /^(\d+)(?:\.(\d+(?:\.\d+)*))?$/;
const APPENDIX_RE = /^[A-Z]$/;

/** "6.3.2" → "s6-3-2". */
export function sectionAnchorId(number) {
  if (!SECTION_RE.test(number)) throw new Error(`Not a section number: ${number}`);
  return `s${number.replace(/\./g, "-")}`;
}

/** "6.3.2" → "section-6". */
export function sectionPageSlug(number) {
  const match = SECTION_RE.exec(number);
  if (!match) throw new Error(`Not a section number: ${number}`);
  return `section-${match[1]}`;
}

/** "6" → /wikipedia-report-2026/section-6, "6.3" → …/section-6#s6-3. */
export function sectionHref(number) {
  const page = `${REPORT_BASE_PATH}/${sectionPageSlug(number)}`;
  return number.includes(".") ? `${page}#${sectionAnchorId(number)}` : page;
}

/** "E" → /wikipedia-report-2026/appendix-e. */
export function appendixHref(letter) {
  if (!APPENDIX_RE.test(letter)) throw new Error(`Not an appendix letter: ${letter}`);
  return `${REPORT_BASE_PATH}/appendix-${letter.toLowerCase()}`;
}

/** Href of a page slug, optionally with a fragment. The front page is the index. */
export function pageHref(slug, fragment) {
  const page = slug === "executive-summary" ? REPORT_BASE_PATH : `${REPORT_BASE_PATH}/${slug}`;
  return fragment ? `${page}#${fragment}` : page;
}

// --- Headings ------------------------------------------------------------

const SECTION_PAGE_RE = /^Section\s+(\d+)\s*[:.]\s*(.+)$/;
const APPENDIX_PAGE_RE = /^Appendix\s+([A-Z])\s*[:.]\s*(.+)$/;
const NUMBERED_RE = /^(\d+(?:\.\d+)+)\s*[:.]?\s*(.*)$/;

/** Front-matter headings that start the front page or are dropped entirely. */
export const FRONT_PAGE_HEADING = "Executive Summary";
export const DROPPED_HEADINGS = new Set(["About Tech for Palestine", "Table of Contents"]);
/** Contract ids for the front page sub-headings (anything else is slugified). */
export const FRONT_HEADING_IDS = {
  "Our Claims in Brief": "claims-in-brief",
  "About this Report": "about-this-report",
};

/**
 * Classify a heading by its visible text. Structure comes from the numbering
 * text, never from the docx heading level (which is inconsistent).
 * @param {string} rawText
 */
export function parseHeading(rawText) {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (text === "") return { kind: "empty" };
  let m = SECTION_PAGE_RE.exec(text);
  if (m) return { kind: "section", number: m[1], title: m[2].trim() };
  m = APPENDIX_PAGE_RE.exec(text);
  if (m) return { kind: "appendix", letter: m[1], title: m[2].trim() };
  m = NUMBERED_RE.exec(text);
  if (m) return { kind: "numbered", number: m[1], title: m[2].trim() };
  return { kind: "plain", title: text };
}

/** Heading element level for a numbered heading: N.M → 2, N.M.K → 3, deeper → 4. */
export function headingLevel(number) {
  return Math.min(number.split(".").length, 4);
}

/**
 * Length of the leading "Section 6:" / "6.3.2:" / "Appendix E:" prefix
 * (including trailing separator and whitespace) of a heading's text.
 */
export function headingPrefixLength(text) {
  const m = /^\s*(?:Section\s+\d+|Appendix\s+[A-Z]|\d+(?:\.\d+)+)\s*[:.]?\s*/.exec(text);
  return m ? m[0].length : 0;
}

/** URL-safe slug, truncated on a word boundary. */
export function slugify(text, maxLength = 48) {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength + 1);
  const lastHyphen = cut.lastIndexOf("-");
  return (lastHyphen > 0 ? cut.slice(0, lastHyphen) : slug.slice(0, maxLength)).replace(/-+$/, "");
}

/**
 * Numbering sanity check: each numbered heading's parent should precede it and
 * its last segment should follow its previous sibling. Returns warnings.
 * @param {string} pageNumber top-level section number of the page, e.g. "6"
 * @param {string[]} numbers numbered headings in document order
 */
export function checkNumbering(pageNumber, numbers) {
  const warnings = [];
  const seen = new Set([pageNumber]);
  const lastChild = new Map();
  for (const number of numbers) {
    const parts = number.split(".");
    const parent = parts.slice(0, -1).join(".");
    const last = Number(parts.at(-1));
    if (parts[0] !== pageNumber) warnings.push(`${number}: outside Section ${pageNumber}`);
    else if (!seen.has(parent)) warnings.push(`${number}: parent ${parent} has no heading`);
    const prev = lastChild.get(parent) ?? 0;
    if (last !== prev + 1) warnings.push(`${number}: expected ${parent}.${prev + 1}`);
    if (seen.has(number)) warnings.push(`${number}: duplicate heading number`);
    lastChild.set(parent, last);
    seen.add(number);
  }
  return warnings;
}

// --- Page splitting --------------------------------------------------------

/**
 * Split a flat block list into report pages, dropping draft matter (everything
 * before "Executive Summary"), the in-document Table of Contents and "About
 * Tech for Palestine".
 * @template B
 * @param {B[]} blocks
 * @param {(block: B) => string | null} headingText text of a heading block, null for non-headings
 * @returns {{ pages: { slug: string, kind: "front" | "section" | "appendix", label?: string, title: string, order: number, number?: string, letter?: string, blocks: B[] }[], dropped: string[] }}
 */
export function splitIntoPages(blocks, headingText) {
  const pages = [];
  const dropped = [];
  let current = null; // page receiving blocks, null while dropping
  for (const block of blocks) {
    const text = headingText(block);
    if (text !== null) {
      const heading = parseHeading(text);
      const plain = heading.kind === "plain" ? heading.title : null;
      if (plain === FRONT_PAGE_HEADING) {
        current = { slug: "executive-summary", kind: "front", title: plain, order: 0, blocks: [] };
        pages.push(current);
        continue;
      }
      if (plain !== null && DROPPED_HEADINGS.has(plain)) {
        dropped.push(plain);
        current = null;
        continue;
      }
      if (heading.kind === "section") {
        current = {
          slug: `section-${heading.number}`,
          kind: "section",
          label: `Section ${heading.number}`,
          title: heading.title,
          order: Number(heading.number),
          number: heading.number,
          blocks: [],
        };
        pages.push(current);
        continue;
      }
      if (heading.kind === "appendix") {
        current = {
          slug: `appendix-${heading.letter.toLowerCase()}`,
          kind: "appendix",
          label: `Appendix ${heading.letter}`,
          title: heading.title,
          order: 100 + heading.letter.charCodeAt(0) - 64,
          letter: heading.letter,
          blocks: [],
        };
        pages.push(current);
        continue;
      }
      // Empty headings separate the front page from the TOC; they never resume a dropped run.
    }
    if (current) current.blocks.push(block);
    else if (pages.length === 0 && text !== null && text.trim() !== "") dropped.push(text.trim());
  }
  return { pages, dropped };
}

// --- HTML helpers ------------------------------------------------------------

export function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

/** Superscript reference to a footnote; `occurrence` > 1 for repeated refs. */
export function footnoteRefHtml(n, occurrence = 1) {
  const id = occurrence > 1 ? `fnref-${n}-${occurrence}` : `fnref-${n}`;
  return `<sup class="fn-ref"><a href="#fn-${n}" id="${id}">${n}</a></sup>`;
}

/**
 * Notes section for one page. The back-link goes inside the note's last
 * paragraph when it ends with one, so it doesn't sit on its own line.
 * @param {{ n: number, html: string }[]} notes
 */
export function notesSectionHtml(notes) {
  if (notes.length === 0) return "";
  const items = notes.map(({ n, html }) => {
    const back = `<a href="#fnref-${n}" class="fn-back" aria-label="Back to reference ${n}">↩\uFE0E</a>`;
    const body = html.trim();
    const withBack = body.endsWith("</p>") ? `${body.slice(0, -4)} ${back}</p>` : `${body} ${back}`;
    return `<li id="fn-${n}" value="${n}">${withBack}</li>`;
  });
  return [
    `<section class="report-notes" aria-labelledby="notes-heading">`,
    `<h2 id="notes-heading">Notes</h2>`,
    `<ol>`,
    ...items,
    `</ol>`,
    `</section>`,
  ].join("\n");
}

export function figureHtml({ src, alt, width, height }) {
  return (
    `<figure class="report-figure"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"` +
    ` width="${width}" height="${height}" loading="lazy" decoding="async"></figure>`
  );
}

export function tableOpenHtml(label) {
  return `<div class="report-table" role="region" aria-label="${escapeAttr(label)}" tabindex="0">`;
}

export const ALLOWED_CLASSES = new Set([
  "report-quote",
  "fn-ref",
  "fn-back",
  "report-notes",
  "report-table",
  "report-figure",
]);

/** Id of the hidden "(opens in a new tab)" hint each reader page renders. */
export const NEW_TAB_HINT_ID = "report-new-tab-hint";

const LINK_ATTRS_SET_BELOW = new Set(["rel", "target", "aria-describedby"]);
const OWN_HOSTS = new Set(["techforpalestine.org", "www.techforpalestine.org"]);

/**
 * Known errors in the source document, corrected on the way out. Each one
 * that fires is reported as a converter warning so it gets fixed in the
 * Google Doc; once it is, the correction finds nothing and can be deleted.
 */
export const SOURCE_CORRECTIONS = [
  {
    find: "https://techforpalestine.org/wikipedia/report",
    replace: "https://techforpalestine.org/wikipedia-report",
    reason: "the report's own address; /wikipedia/report does not exist",
  },
];

/** Apply SOURCE_CORRECTIONS (exact string matches) to a page's HTML. */
export function applySourceCorrections(html, corrections = SOURCE_CORRECTIONS) {
  let out = html;
  const applied = [];
  for (const correction of corrections) {
    const parts = out.split(correction.find);
    if (parts.length > 1) {
      out = parts.join(correction.replace);
      applied.push({ ...correction, count: parts.length - 1 });
    }
  }
  return { html: out, applied };
}

/** True for http(s) links to another site. Links to our own site stay in the same tab. */
export function isExternalHref(href) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return !OWN_HOSTS.has(new URL(href).hostname.toLowerCase());
  } catch {
    return true;
  }
}

/**
 * Clean pandoc HTML: drop every style attribute and any class not in the
 * contract, drop <colgroup> (column widths are inline styles), unwrap spans
 * left without attributes. External links (http/https to another site) open
 * in a new tab: they get target="_blank", rel="noopener noreferrer" and
 * aria-describedby pointing at the page's hidden "opens in a new tab" hint
 * (NEW_TAB_HINT_ID, rendered by the reader pages). Links to our own site stay
 * in the same tab.
 */
export function sanitizeHtml(html) {
  let out = html.replace(/<colgroup>[\s\S]*?<\/colgroup>\s*/g, "");
  out = out.replace(
    /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g,
    (_m, tag, attrs, selfClose) => {
      const kept = [];
      for (const [, name, value] of attrs.matchAll(/\s+([^\s=>/]+)(?:="([^"]*)")?/g)) {
        const lower = name.toLowerCase();
        if (lower === "style" || lower.startsWith("on")) continue;
        if (lower === "class") {
          const classes = (value ?? "").split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
          if (classes.length) kept.push(`class="${classes.join(" ")}"`);
          continue;
        }
        if (LINK_ATTRS_SET_BELOW.has(lower) && tag.toLowerCase() === "a") continue;
        kept.push(value === undefined ? name : `${name}="${value}"`);
      }
      if (tag.toLowerCase() === "a") {
        const href = kept.find((a) => a.startsWith("href="));
        if (href && isExternalHref(href.slice(6, -1))) {
          kept.push(
            `target="_blank"`,
            `rel="noopener noreferrer"`,
            `aria-describedby="${NEW_TAB_HINT_ID}"`
          );
        }
      }
      const attrText = kept.length ? ` ${kept.join(" ")}` : "";
      return `<${tag}${attrText}${selfClose ? " /" : ""}>`;
    }
  );
  return unwrapBareSpans(out);
}

/** Remove <span> elements that carry no attributes (keeps their content). */
function unwrapBareSpans(html) {
  const tokens = html.split(/(<\/?span\b[^>]*>)/);
  const stack = [];
  return tokens
    .map((token) => {
      if (/^<span\b/.test(token)) {
        const bare = token === "<span>";
        stack.push(bare);
        return bare ? "" : token;
      }
      if (token === "</span>") return stack.pop() ? "" : token;
      return token;
    })
    .join("");
}

/** Remove blank lines so Markdown treats the whole body as one raw HTML block. */
export function collapseBlankLines(html) {
  return html.replace(/\n[ \t]*(?:\n[ \t]*)+/g, "\n").trim();
}

// --- Cross references ----------------------------------------------------------

const NUM = String.raw`\d+(?:\.\d+)*`;
const SECTION_REF_RE = new RegExp(
  String.raw`\b(Sections?\s+)(${NUM})((?:\s*(?:,\s*and|,|and|&|or|to|through|–|-)\s*(?:Sections?\s+)?${NUM}\b)*)`,
  "g"
);
const APPENDIX_REF_RE =
  /\b(Appendix\s+|Appendices\s+)([A-Z])\b((?:\s*(?:,\s*and|,|and|&|or|to|through|–|-)\s*[A-Z]\b)*)/g;

/**
 * Text immediately preceding a "Section N" that refers to an external
 * document, not this report. Matched against the 60 chars before the match.
 */
export const EXTERNAL_SECTION_CONTEXTS = [/Board of Trustees,\s*$/, /Code of Conduct\s*\($/];

/**
 * Link "Section 6.3", "Sections 6.3, 6.4, and 6.5", "Appendix E" in prose.
 * Text inside existing links and headings is left alone. `resolve` returns an
 * href or null (unknown target → left as plain text and reported).
 * @param {string} html
 * @param {{ section: (n: string) => string | null, appendix: (l: string) => string | null }} resolve
 * @param {{ linked: string[], unresolved: string[], skipped: string[] }} [log]
 */
export function linkCrossReferences(
  html,
  resolve,
  log = { linked: [], unresolved: [], skipped: [] }
) {
  const tokens = html.split(/(<[^>]*>)/);
  let skipDepth = 0;
  return tokens
    .map((token) => {
      if (token.startsWith("<")) {
        if (/^<(a|h[1-6])\b/i.test(token)) skipDepth++;
        else if (/^<\/(a|h[1-6])>/i.test(token)) skipDepth = Math.max(0, skipDepth - 1);
        return token;
      }
      if (skipDepth > 0 || token === "") return token;
      return linkTextNode(token, resolve, log);
    })
    .join("");
}

function linkTextNode(text, resolve, log) {
  let out = text.replace(SECTION_REF_RE, (match, word, first, rest, offset) => {
    const before = text.slice(Math.max(0, offset - 60), offset);
    if (EXTERNAL_SECTION_CONTEXTS.some((re) => re.test(before))) {
      log.skipped.push(match);
      return match;
    }
    return linkList(match, word, first, rest, new RegExp(NUM, "g"), resolve.section, log);
  });
  out = out.replace(APPENDIX_REF_RE, (match, word, first, rest) =>
    linkList(match, word, first, rest, /\b[A-Z]\b/g, resolve.appendix, log)
  );
  return out;
}

/** Link the first target together with its keyword, then each further target alone. */
function linkList(match, word, first, rest, itemRe, resolver, log) {
  const firstHref = resolver(first);
  if (!firstHref) {
    log.unresolved.push(match);
    return match;
  }
  log.linked.push(`${word}${first}`);
  const linkedRest = rest.replace(itemRe, (item) => {
    const href = resolver(item);
    if (!href) {
      log.unresolved.push(`${word}${item}`);
      return item;
    }
    log.linked.push(`${word}${item}`);
    return `<a href="${href}">${item}</a>`;
  });
  return `<a href="${firstHref}">${word}${first}</a>${linkedRest}`;
}

// --- Frontmatter ---------------------------------------------------------------

/** YAML frontmatter; strings are JSON-quoted, which is valid YAML. */
export function frontmatter(page) {
  const lines = ["---", `slug: ${page.slug}`, `kind: ${page.kind}`];
  if (page.label) lines.push(`label: ${JSON.stringify(page.label)}`);
  lines.push(`title: ${JSON.stringify(page.title)}`, `order: ${page.order}`);
  if (page.toc.length === 0) lines.push("toc: []");
  else {
    lines.push("toc:");
    for (const entry of page.toc) {
      const parts = [];
      if (entry.number) parts.push(`number: ${JSON.stringify(entry.number)}`);
      parts.push(
        `title: ${JSON.stringify(entry.title)}`,
        `depth: ${entry.depth}`,
        `id: ${JSON.stringify(entry.id)}`
      );
      lines.push(`  - { ${parts.join(", ")} }`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

// --- Images --------------------------------------------------------------------

/**
 * Pixel size of a PNG, JPEG or WebP buffer, or null if unrecognised.
 * @param {Uint8Array} buf
 */
export function imageSize(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const ascii = (start, end) => String.fromCharCode(...buf.subarray(start, end));
  if (buf.length >= 24 && ascii(1, 4) === "PNG") {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (buf.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    const chunk = ascii(12, 16);
    if (chunk === "VP8X") {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width: w, height: h };
    }
    if (chunk === "VP8 ") {
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    if (chunk === "VP8L") {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    return null;
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) return null;
      const marker = buf[offset + 1];
      const length = view.getUint16(offset + 2);
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof) return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
      offset += 2 + length;
    }
  }
  return null;
}

// --- Verification ------------------------------------------------------------

/**
 * Structural checks across all generated pages. Returns error strings.
 * @param {{ slug: string, html: string }[]} pages
 */
export function verifyPages(pages) {
  const errors = [];
  const idsBySlug = new Map();
  for (const page of pages) {
    const ids = [...page.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${page.slug}: duplicate id "${id}"`);
      seen.add(id);
    }
    idsBySlug.set(page.slug, seen);

    for (const m of page.html.matchAll(/<sup class="fn-ref"><a href="#fn-(\d+)" id="([^"]+)">/g)) {
      if (!seen.has(`fn-${m[1]}`))
        errors.push(`${page.slug}: note ${m[1]} referenced but not defined`);
    }
    for (const m of page.html.matchAll(/<li id="fn-(\d+)"/g)) {
      if (!seen.has(`fnref-${m[1]}`))
        errors.push(`${page.slug}: note ${m[1]} defined but never referenced`);
    }
    if (/<script|<iframe|\sstyle="|\son[a-z]+="/i.test(page.html)) {
      errors.push(`${page.slug}: forbidden markup (script, iframe, style or event handler)`);
    }
    for (const m of page.html.matchAll(/\sclass="([^"]*)"/g)) {
      for (const cls of m[1].split(/\s+/)) {
        if (!ALLOWED_CLASSES.has(cls)) errors.push(`${page.slug}: unexpected class "${cls}"`);
      }
    }
  }
  for (const page of pages) {
    for (const m of page.html.matchAll(/<a href="([^"]*)"/g)) {
      const href = m[1];
      let slug;
      let fragment;
      if (href.startsWith("#")) {
        slug = page.slug;
        fragment = href.slice(1);
      } else if (
        href === REPORT_BASE_PATH ||
        href.startsWith(`${REPORT_BASE_PATH}/`) ||
        href.startsWith(`${REPORT_BASE_PATH}#`)
      ) {
        const rest = href.slice(REPORT_BASE_PATH.length).replace(/^\//, "");
        const [path, frag] = rest.split("#");
        slug = path === "" ? "executive-summary" : path;
        fragment = frag;
      } else continue;
      const ids = idsBySlug.get(slug);
      if (!ids) errors.push(`${page.slug}: link to missing page "${href}"`);
      else if (fragment && !ids.has(fragment))
        errors.push(`${page.slug}: link to missing anchor "${href}"`);
    }
  }
  return errors;
}

// --- Quote captions ------------------------------------------------------------
// In the Google Doc, quoted passages are indented 720 twips and the caption /
// attribution line under them 1440. Pandoc merges both levels into one
// BlockQuote, so the indentation in word/document.xml is the only reliable
// signal for which paragraphs are captions.

/** Comparable form of paragraph text: no whitespace, straight quotes, lower case. */
export function normalizeCaption(text) {
  return text
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\s\u00A0]+/g, "")
    .toLowerCase();
}

const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function paragraphText(xml) {
  let out = "";
  for (const m of xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:(?:br|tab)\b[^>]*\/>/g)) {
    out += m[1] === undefined ? " " : m[1];
  }
  return out.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (_m, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return XML_ENTITIES[e.toLowerCase()];
  });
}

/** Paragraph indent in twips: { left, firstLine, hanging } (absent = 0). */
function paragraphIndent(paraXml) {
  const tag = paraXml.match(/<w:ind\b[^>]*\/>/)?.[0] ?? "";
  const get = (name) => Number(tag.match(new RegExp(`\\sw:${name}="(-?\\d+)"`))?.[1] ?? 0);
  return {
    left: get("left") || get("start"),
    firstLine: get("firstLine"),
    hanging: get("hanging"),
  };
}

const QUOTE_INDENT = 720;
const CAPTION_INDENT = 1440;

/**
 * Normalized text of every caption paragraph: its effective first-line indent
 * (left + firstLine, e.g. left 1440 or left 720 + firstLine 720) is at least
 * 1440 and the previous non-empty paragraph is a quote (left 720) or another
 * caption. `skipped` lists paragraphs right after a quote that have some other
 * unusual indent (not quote, body or heading) so misses stay visible.
 * @param {string} documentXml word/document.xml
 * @returns {{ texts: Set<string>, originals: Map<string, string>, count: number, skipped: string[], breaks: Set<string> }}
 *   count includes duplicate texts
 */
export function extractCaptionTexts(documentXml) {
  const texts = new Set();
  const originals = new Map(); // normalized → display text
  const skipped = [];
  // Texts of quote-run paragraphs directly followed by an empty paragraph;
  // pandoc drops empty paragraphs, but they separate one quote from the next.
  const breaks = new Set();
  let prevNorm = null;
  let count = 0;
  let prevLeft = null;
  let prevIsPlainQuote = false;
  let prevWasCaption = false;
  for (const [para] of documentXml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const text = paragraphText(para).trim();
    if (!text) {
      const hasObject = /<w:(?:drawing|pict|object)\b/.test(para);
      if (!hasObject && prevNorm !== null && prevLeft >= QUOTE_INDENT) breaks.add(prevNorm);
      continue;
    }
    const { left, firstLine, hanging } = paragraphIndent(para);
    prevNorm = normalizeCaption(text);
    const afterQuote = prevLeft === QUOTE_INDENT || prevWasCaption;
    const isCaption = left + firstLine >= CAPTION_INDENT && afterQuote;
    if (isCaption) {
      // A caption line can share its paragraph with the next quote after a
      // line break; the first line alone is then the caption.
      const firstLineText = paragraphText(para.split(/<w:br\b[^>]*\/>/)[0]).trim();
      for (const t of new Set([text, firstLineText])) {
        if (!t) continue;
        texts.add(normalizeCaption(t));
        originals.set(normalizeCaption(t), t);
      }
      count++;
    } else if (
      prevIsPlainQuote &&
      hanging === 0 &&
      (left > QUOTE_INDENT || firstLine > 0 || /^[-\u2013\u2014]\s/.test(text)) &&
      !(left === QUOTE_INDENT && firstLine === 0)
    ) {
      skipped.push(text);
    }
    prevLeft = left;
    prevIsPlainQuote = left === QUOTE_INDENT && firstLine === 0 && hanging === 0;
    prevWasCaption = isCaption;
  }
  return { texts, originals, count, skipped, breaks };
}
