// Pandoc JSON AST transforms for the Wikipedia report converter.
// Pure functions over the AST (image handling is injected), unit-tested in
// ast.test.ts. The AST format is documented at
// https://hackage.haskell.org/package/pandoc-types (Text.Pandoc.Definition).

import {
  FRONT_HEADING_IDS,
  appendixHref,
  escapeAttr,
  figureHtml,
  normalizeCaption,
  footnoteRefHtml,
  headingLevel,
  headingPrefixLength,
  pageHref,
  parseHeading,
  sectionAnchorId,
  sectionHref,
  slugify,
  tableOpenHtml,
} from "./transform.mjs";

const BLOCK_TYPES = new Set([
  "Plain",
  "Para",
  "LineBlock",
  "CodeBlock",
  "RawBlock",
  "BlockQuote",
  "OrderedList",
  "BulletList",
  "DefinitionList",
  "Header",
  "HorizontalRule",
  "Table",
  "Figure",
  "Div",
]);
const INLINE_TYPES = new Set([
  "Str",
  "Emph",
  "Underline",
  "Strong",
  "Strikeout",
  "Superscript",
  "Subscript",
  "SmallCaps",
  "Quoted",
  "Cite",
  "Code",
  "Space",
  "SoftBreak",
  "LineBreak",
  "Math",
  "RawInline",
  "Link",
  "Image",
  "Note",
  "Span",
]);

/** Items of a pandoc BulletList (c) or OrderedList (c[1]). */
const listItems = (list) => (list.t === "BulletList" ? list.c : list.c[1]);

const OPENING_QUOTE = /^["\u201C\u2018]/;
/** Ends with a closing quote mark, ignoring trailing whitespace and punctuation. */
const CLOSED_QUOTE = /["\u201D\u2019][\s.,;:)\]]*$/;
const isFigureBlock = (b) =>
  b.t === "RawBlock" && b.c[1].startsWith('<figure class="report-figure"');

/** "- Source" / "– Source" / "— Source" caption lead becomes "— Source". */
function dashToEmDash(inlines) {
  const [first, ...rest] = inlines;
  if (first?.t !== "Str" || !/^[-\u2013\u2014]/.test(first.c)) return inlines;
  const tail = first.c.replace(/^[-\u2013\u2014]+/, "");
  const lead = { t: "Str", c: "\u2014" };
  return tail ? [lead, { t: "Space" }, { t: "Str", c: tail }, ...rest] : [lead, ...rest];
}

/**
 * A paragraph merged from several quotes by double line breaks is split where
 * the text after the break opens with a quotation mark.
 */
function splitMergedQuotes(block) {
  if (block.t !== "Para" && block.t !== "Plain") return [block];
  const parts = [];
  let run = [];
  const inlines = block.c;
  for (let i = 0; i < inlines.length; i++) {
    if (inlines[i].t === "LineBreak" && inlines[i + 1]?.t === "LineBreak") {
      let j = i;
      while (inlines[j]?.t === "LineBreak") j++;
      if (OPENING_QUOTE.test(stringify(inlines.slice(j)).trimStart())) {
        parts.push(run);
        run = [];
        i = j - 1;
        continue;
      }
    }
    run.push(inlines[i]);
  }
  parts.push(run);
  return parts.filter((r) => r.length).map((c) => ({ t: block.t, c }));
}

const raw = (html) => ({ t: "RawBlock", c: ["html", html] });
const rawInline = (html) => ({ t: "RawInline", c: ["html", html] });

/** Plain text of an AST fragment (footnotes excluded). */
export function stringify(node) {
  let out = "";
  (function walk(x) {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== "object") return;
    if (x.t === "Str") out += x.c;
    else if (x.t === "Space" || x.t === "SoftBreak" || x.t === "LineBreak") out += " ";
    else if (x.t === "Note") return;
    else if (x.c !== undefined) walk(x.c);
  })(node);
  return out;
}

/** Visit every AST node in document order. */
export function walkAst(node, visit) {
  if (Array.isArray(node)) return node.forEach((n) => walkAst(n, visit));
  if (!node || typeof node !== "object") return;
  if (typeof node.t === "string") visit(node);
  if (node.c !== undefined) walkAst(node.c, visit);
}

/**
 * Number footnotes in document order over the whole document (including
 * dropped draft matter) so numbers match the PDF. Keyed by node identity.
 */
export function numberNotes(blocks) {
  const numbers = new Map();
  walkAst(blocks, (node) => {
    if (node.t === "Note") numbers.set(node, numbers.size + 1);
  });
  return numbers;
}

export function headerText(block) {
  return block && block.t === "Header" ? stringify(block.c[2]) : null;
}

/** Remove Strong/Underline wrappers, highlight spans and edge whitespace/line breaks from heading inlines. */
export function cleanHeadingInlines(inlines) {
  const unwrap = (nodes) =>
    nodes.flatMap((node) => {
      if (node.t === "Strong" || node.t === "Underline") return unwrap(node.c);
      if (node.t === "Span" && node.c[0][1].includes("mark")) return unwrap(node.c[1]);
      return [node];
    });
  const out = unwrap(inlines);
  while (out.length && isBlank(out[0])) out.shift();
  while (out.length && isBlank(out.at(-1))) out.pop();
  return out;
}

/** Drop the first `count` characters from the leading run of Str/Space inlines. */
export function dropLeadingChars(inlines, count) {
  const out = [...inlines];
  let remaining = count;
  while (remaining > 0 && out.length) {
    const first = out[0];
    if (first.t === "Space" || first.t === "SoftBreak") {
      out.shift();
      remaining -= 1;
    } else if (first.t === "Str") {
      if (first.c.length <= remaining) {
        out.shift();
        remaining -= first.c.length;
      } else {
        out[0] = { t: "Str", c: first.c.slice(remaining) };
        remaining = 0;
      }
    } else break;
  }
  while (out.length && (out[0].t === "Space" || out[0].t === "SoftBreak")) out.shift();
  return out;
}

/** Text of the leading run of Str/Space inlines (where a heading number lives). */
function leadingText(inlines) {
  let text = "";
  for (const node of inlines) {
    if (node.t === "Str") text += node.c;
    else if (node.t === "Space" || node.t === "SoftBreak") text += " ";
    else break;
  }
  return text;
}

/**
 * Work out level, id and display content of every heading on a page.
 * @returns {Map<object, { level: number, id: string, number?: string, title: string, inlines: object[] } | null>}
 *   null for headings that are dropped (empty).
 */
export function planHeadings(page) {
  const plan = new Map();
  const usedIds = new Set();
  let previous = null; // last emitted heading on the page
  for (const block of page.blocks) {
    if (block.t !== "Header") continue;
    const cleaned = cleanHeadingInlines(block.c[2]);
    const heading = parseHeading(stringify(cleaned));
    if (heading.kind === "empty") {
      plan.set(block, null);
      continue;
    }
    const content = dropLeadingChars(cleaned, headingPrefixLength(leadingText(cleaned)));
    const title = stringify(content).replace(/\s+/g, " ").trim();
    let entry;
    if (page.kind === "section" && heading.kind === "numbered") {
      entry = {
        level: headingLevel(heading.number),
        id: sectionAnchorId(heading.number),
        number: heading.number,
        title,
        inlines: [{ t: "Str", c: heading.number }, { t: "Space" }, ...content],
      };
    } else if (page.kind === "section") {
      // Unnumbered sub-heading (e.g. "Lengthy discussion" under 6.3.4.5.4).
      const level = Math.min((previous?.level ?? 1) + 1, 4);
      const base = previous ? `${previous.id}-` : "";
      entry = { level, id: `${base}${slugify(title)}`, title, inlines: content };
    } else {
      const text = stringify(cleaned).replace(/\s+/g, " ").trim();
      entry = {
        level: 2,
        id: FRONT_HEADING_IDS[text] ?? slugify(text),
        title: text,
        inlines: cleaned,
      };
    }
    let id = entry.id;
    for (let i = 2; usedIds.has(id); i++) id = `${entry.id}-${i}`;
    entry.id = id;
    usedIds.add(id);
    plan.set(block, entry);
    if (entry.number || page.kind !== "section") previous = entry;
  }
  return plan;
}

/** href of a heading on a page, for remapping pandoc's internal "#id" links. */
function headingHref(page, entry) {
  if (page.kind === "section" && entry.number) return sectionHref(entry.number);
  return pageHref(page.slug, entry.id);
}

/** href of a whole page. */
export function pageTopHref(page) {
  if (page.kind === "section") return sectionHref(page.number);
  if (page.kind === "appendix") return appendixHref(page.letter);
  return pageHref(page.slug);
}

/**
 * Build the context shared by all page transforms: heading plans, the map from
 * pandoc's auto ids to our hrefs, and the set of known section numbers.
 * @param {{ blocks: object[] }} doc full pandoc document
 * @param {object[]} pages pages from splitIntoPages
 */
export function buildDocumentIndex(doc, pages) {
  const plans = new Map();
  const pandocIdToHref = new Map();
  const knownNumbers = new Set();
  const pageHeadingIds = new Map();
  for (const page of pages) {
    const plan = planHeadings(page);
    plans.set(page, plan);
    for (const [block, entry] of plan) {
      if (!entry) continue;
      if (block.c[1][0]) pandocIdToHref.set(block.c[1][0], headingHref(page, entry));
      if (entry.number) knownNumbers.add(entry.number);
    }
    if (page.number) knownNumbers.add(page.number);
  }
  // Page-title headings were consumed by splitIntoPages; map their pandoc ids too.
  for (const block of doc.blocks) {
    const text = headerText(block);
    if (text === null || !block.c[1][0]) continue;
    const heading = parseHeading(text);
    const page = pages.find(
      (p) =>
        (heading.kind === "section" && p.number === heading.number) ||
        (heading.kind === "appendix" && p.letter === heading.letter) ||
        (p.kind === "front" && heading.kind === "plain" && heading.title === p.title)
    );
    if (page) pageHeadingIds.set(block.c[1][0], pageTopHref(page));
  }
  for (const [id, href] of pageHeadingIds) pandocIdToHref.set(id, href);
  const slugs = new Set(pages.map((p) => p.slug));
  return {
    plans,
    pandocIdToHref,
    resolveSection: (n) => {
      if (!n.includes(".")) return slugs.has(`section-${n}`) ? sectionHref(n) : null;
      return knownNumbers.has(n) ? sectionHref(n) : null;
    },
    resolveAppendix: (letter) =>
      slugs.has(`appendix-${letter.toLowerCase()}`) ? appendixHref(letter) : null,
  };
}

/** Section/appendix reference spelled out in a link's text, e.g. "Section 6.1" or "6.1". */
function hrefFromLinkText(text, index) {
  const t = text.trim();
  let m = /^(?:Sections?\s+)?(\d+(?:\.\d+)*)$/.exec(t);
  if (m) return index.resolveSection(m[1]);
  m = /^Appendix\s+([A-Z])$/.exec(t);
  if (m) return index.resolveAppendix(m[1]);
  return null;
}

function unwrapUnderline(inlines) {
  return inlines.flatMap((n) => (n.t === "Underline" ? unwrapUnderline(n.c) : [n]));
}

/** Unwrap Strong/Underline that wrap a link's entire text ("<a><strong><u>Section 6.3</u></strong></a>"). */
export function unwrapWholeLinkFormatting(inlines) {
  let out = inlines;
  while (out.length === 1 && (out[0].t === "Strong" || out[0].t === "Underline")) out = out[0].c;
  return out;
}

/** True for paragraphs with no visible content (only whitespace, nbsp or line breaks). */
export function isEmptyParagraph(inlines) {
  let hasContent = false;
  walkAst(inlines, (node) => {
    if (
      node.t === "Image" ||
      node.t === "Note" ||
      node.t === "RawInline" ||
      node.t === "Math" ||
      node.t === "Code"
    )
      hasContent = true;
  });
  return !hasContent && stringify(inlines).trim() === "";
}

/**
 * Transform one page's blocks into render-ready AST: headings → <hN id>,
 * footnotes → numbered refs, internal links → contract hrefs, images →
 * figures, tables → scrollable regions.
 * @param {object} page page from splitIntoPages
 * @param {object} ctx { index, noteNumbers, image(src) → {src,alt,width,height}, warn(msg) }
 */
export function transformPage(page, ctx) {
  const captions = ctx.captions ?? new Set();
  const plan = ctx.index.plans.get(page);
  const state = {
    toc: [],
    notes: [], // [{ n, blocks }] in order of first reference
    noteOccurrences: new Map(),
    location: page.label ?? page.title,
    tableLabels: new Map(),
    tableDepth: 0,
  };

  const mapNode = (x) => {
    if (Array.isArray(x)) {
      const kind = x.length && x[0] && typeof x[0] === "object" ? x[0].t : undefined;
      if (BLOCK_TYPES.has(kind)) return transformBlocks(x);
      if (INLINE_TYPES.has(kind)) return transformInlines(x);
      return x.map(mapNode);
    }
    if (x && typeof x === "object") {
      return typeof x.t === "string"
        ? { t: x.t, ...(x.c !== undefined ? { c: mapNode(x.c) } : {}) }
        : x;
    }
    return x;
  };

  const transformBlocks = (blocks) => foldListCaptions(blocks).flatMap(transformBlock);

  /**
   * Pandoc turns a caption that Google Docs formatted as a one-item list
   * into a BulletList/OrderedList right after the BlockQuote. Move it back
   * into the quote so it is handled as a caption.
   */
  function foldListCaptions(blocks) {
    const out = [];
    for (const block of blocks) {
      const prev = out.at(-1);
      const item = captionListItem(block);
      if (item && prev?.t === "BlockQuote") out[out.length - 1] = { ...prev, c: [...prev.c, item] };
      else out.push(block);
    }
    return out;
  }

  function captionListItem(block) {
    const items = block.t === "BulletList" || block.t === "OrderedList" ? listItems(block) : null;
    if (items?.length !== 1 || items[0].length !== 1) return null;
    const [para] = items[0];
    if (para.t !== "Para" && para.t !== "Plain") return null;
    return captions.has(normalizeCaption(stringify(para.c).trim())) ? para : null;
  }

  function transformBlock(block) {
    switch (block.t) {
      case "Header":
        return transformHeader(block);
      case "Para":
      case "Plain":
        return transformParagraph(block);
      case "Table":
        return transformTable(block);
      case "BlockQuote":
        return transformBlockQuote(block);
      case "Figure":
        ctx.warn(`${state.location}: unexpected pandoc Figure block`);
        return [mapNode(block)];
      default:
        return [mapNode(block)];
    }
  }

  function transformHeader(block) {
    const entry = plan.get(block);
    if (!entry) return [];
    const tag = `h${entry.level}`;
    if (entry.number || page.kind !== "section") {
      state.toc.push({
        ...(entry.number ? { number: entry.number } : {}),
        title: entry.title,
        depth: entry.level,
        id: entry.id,
      });
    }
    state.location = entry.number
      ? `${entry.number} ${entry.title}`
      : `${page.label ?? page.title} › ${entry.title}`;
    return [
      raw(`<${tag} id="${escapeAttr(entry.id)}">`),
      { t: "Plain", c: transformInlines(entry.inlines) },
      raw(`</${tag}>`),
    ];
  }

  /**
   * One pandoc BlockQuote holds several quotes and their captions (see
   * extractCaptionTexts). Split it: each quote becomes its own <blockquote>,
   * and quotes followed by a caption are grouped in a
   * <figure class="report-quote"> with a <figcaption>.
   */
  function transformBlockQuote(block) {
    const out = [];
    let quotes = []; // each: transformed blocks of one quote
    const flushBare = () => {
      for (const q of quotes) out.push(raw("<blockquote>"), ...q, raw("</blockquote>"));
      quotes = [];
    };
    const startQuote = () => quotes.push([]);
    let lastQuoteText = "";

    for (const inner of block.c.flatMap(splitMergedQuotes)) {
      const isPara = inner.t === "Para" || inner.t === "Plain";
      const text = isPara ? stringify(inner.c).trim() : "";
      if (isPara && text && captions.has(normalizeCaption(text))) {
        ctx.captionMatched?.add(normalizeCaption(text));
        if (!quotes.length) {
          ctx.warn(`${state.location}: caption without a preceding quote: "${text.slice(0, 60)}"`);
          out.push(...transformParagraph(inner));
          continue;
        }
        out.push(raw('<figure class="report-quote">'));
        for (const q of quotes) out.push(raw("<blockquote>"), ...q, raw("</blockquote>"));
        out.push(
          raw("<figcaption>"),
          { t: "Plain", c: dashToEmDash(transformInlines(inner.c)) },
          raw("</figcaption></figure>")
        );
        quotes = [];
        continue;
      }
      const blocks = transformBlock(inner);
      if (isPara && blocks.length && blocks.every(isFigureBlock)) {
        flushBare();
        out.push(...blocks); // image-only paragraph: no blockquote wrapper
        continue;
      }
      // Multi-paragraph quotes open every paragraph with a quote mark but
      // close only the last, so a new quote needs the previous one closed.
      if (
        !quotes.length ||
        (isPara && OPENING_QUOTE.test(text) && CLOSED_QUOTE.test(lastQuoteText))
      )
        startQuote();
      quotes.at(-1).push(...blocks);
      if (isPara) lastQuoteText = text;
    }
    flushBare();
    return out;
  }

  /**
   * Top-level tables get the scrollable region wrapper. Single-cell tables
   * nested in a cell are Google Docs layout artifacts and are unwrapped.
   */
  function transformTable(block) {
    const nested = state.tableDepth > 0;
    const cell = nested ? singleCellContent(block) : null;
    if (cell) return transformBlocks(cell);
    state.tableDepth++;
    const table = { t: "Table", c: mapNode(normalizeTableHead(block).c) };
    state.tableDepth--;
    return nested ? [table] : [raw(tableOpenHtml(tableLabel(block))), table, raw("</div>")];
  }

  function tableLabel(block) {
    const caption = stringify(block.c[1]).trim();
    if (caption) return caption;
    const base = `Table: ${state.location}`;
    const count = (state.tableLabels.get(base) ?? 0) + 1;
    state.tableLabels.set(base, count);
    return count > 1 ? `${base} (${count})` : base;
  }

  /** Paragraphs containing images are split so each image becomes a block-level figure. */
  function transformParagraph(block) {
    const inlines = block.c;
    if (isEmptyParagraph(inlines)) return [];
    if (!inlines.some((n) => n.t === "Image"))
      return [{ t: block.t, c: transformInlines(inlines) }];
    const out = [];
    let run = [];
    const flush = () => {
      while (run.length && isBlank(run[0])) run.shift();
      while (run.length && isBlank(run.at(-1))) run.pop();
      if (run.length) out.push({ t: block.t, c: transformInlines(run) });
      run = [];
    };
    for (const node of inlines) {
      if (node.t === "Image") {
        flush();
        const img = ctx.image(node.c[2][0], state.location);
        if (img) out.push(raw(figureHtml(img))); // null: omitted via image-alt.json
      } else run.push(node);
    }
    flush();
    return out;
  }

  const transformInlines = (inlines) => inlines.flatMap(transformInline);

  function transformInline(node) {
    switch (node.t) {
      case "Note":
        return [rawInline(noteRef(node))];
      case "Link":
        return transformLink(node);
      case "Span": {
        const [attr, content] = node.c;
        if (attr[1].includes("mark")) {
          ctx.highlight?.(state.location, stringify(content));
          return transformInlines(content);
        }
        return [{ t: "Span", c: [attr, transformInlines(content)] }];
      }
      case "Image": {
        ctx.warn(`${state.location}: image nested inside inline content; emitted without <figure>`);
        const img = ctx.image(node.c[2][0], state.location);
        if (!img) return [];
        return [rawInline(figureHtml(img).replace(/^<figure[^>]*>|<\/figure>$/g, ""))];
      }
      default:
        return [mapNode(node)];
    }
  }

  function noteRef(node) {
    const n = ctx.noteNumbers.get(node);
    const occurrence = (state.noteOccurrences.get(n) ?? 0) + 1;
    state.noteOccurrences.set(n, occurrence);
    if (occurrence === 1) {
      const entry = { n, blocks: [] };
      state.notes.push(entry);
      entry.blocks = transformBlocks(node.c); // after push: notes nested in notes keep order
    }
    return footnoteRefHtml(n, occurrence);
  }

  function transformLink(node) {
    const [attr, content, [url, title]] = node.c;
    if (!url.startsWith("#"))
      return [{ t: "Link", c: [attr, transformInlines(unwrapUnderline(content)), [url, title]] }];
    const inner = transformInlines(unwrapUnderline(unwrapWholeLinkFormatting(content)));
    const text = stringify(content);
    const byId = ctx.index.pandocIdToHref.get(url.slice(1));
    const byText = hrefFromLinkText(text, ctx.index);
    // The visible text ("Section 6.3.4.5.6") is what readers rely on, so it wins over the docx target.
    if (byId && byText && byId !== byText) {
      ctx.warn(
        `${state.location}: link "${text}" targeted ${url} (${byId}); linked to ${byText} as its text says`
      );
    }
    const href = byText ?? byId;
    if (!href) {
      ctx.warn(
        `${state.location}: internal link "${text}" → ${url} has no target; left as plain text`
      );
      return inner;
    }
    if (!byId && byText)
      ctx.warn(
        `${state.location}: broken bookmark ${url} for "${text}"; resolved from link text to ${href}`
      );
    return [{ t: "Link", c: [["", [], []], inner, [href, ""]] }];
  }

  const blocks = transformBlocks(page.blocks);
  return { blocks, toc: state.toc, notes: state.notes };
}

/** All rows of a table: head, body head rows, body rows, foot. */
function tableRows(table) {
  const [, , , head, bodies, foot] = table.c;
  return [...head[1], ...bodies.flatMap((b) => [...b[2], ...b[3]]), ...foot[1]];
}

/** Blocks of a 1x1 table's only cell, or null. */
export function singleCellContent(table) {
  const rows = tableRows(table);
  if (rows.length !== 1 || rows[0][1].length !== 1) return null;
  return rows[0][1][0][4];
}

/**
 * Google Docs exports often flag every row as a header row. Keep only the
 * first row in <thead>; the rest become body rows.
 */
export function normalizeTableHead(table) {
  const [attr, caption, colspecs, head, bodies, foot] = table.c;
  const headRows = head[1];
  if (headRows.length <= 1) return table;
  const [first, ...rest] = headRows;
  const [firstBody, ...otherBodies] = bodies.length ? bodies : [[["", [], []], 0, [], []]];
  const body = [firstBody[0], firstBody[1], firstBody[2], [...rest, ...firstBody[3]]];
  return {
    t: "Table",
    c: [attr, caption, colspecs, [head[0], [first]], [body, ...otherBodies], foot],
  };
}

function isBlank(node) {
  return node.t === "Space" || node.t === "SoftBreak" || node.t === "LineBreak";
}
