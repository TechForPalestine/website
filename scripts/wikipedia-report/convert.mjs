#!/usr/bin/env node
// Convert the "Israel is Attacking Wikipedia" report (.docx Google Docs
// export) into the committed reader content:
//   src/content/wikipedia-report/*.md      one page per section/appendix
//   public/images/wikipedia-report/*       figures (WebP when smaller)
//
// Usage: node scripts/wikipedia-report/convert.mjs <path-to-report.docx>
//
// LOCAL-ONLY requirements (never needed by the site build, the output is
// committed): pandoc >= 3 on PATH. ImageMagick (`magick`) is optional; without
// it images are copied unconverted. See README.md in this folder.
//
// Every run fully regenerates the output folders, then verifies the result and
// exits non-zero (without writing anything) if a check fails.

/* eslint-disable no-console -- CLI: the conversion report is the output */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDocumentIndex,
  headerText,
  numberNotes,
  stringify,
  transformPage,
  walkAst,
} from "./ast.mjs";
import {
  collapseBlankLines,
  frontmatter,
  imageSize,
  linkCrossReferences,
  notesSectionHtml,
  sanitizeHtml,
  splitIntoPages,
  checkNumbering,
  verifyPages,
} from "./transform.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT_DIR = path.join(REPO_ROOT, "src/content/wikipedia-report");
const IMAGE_DIR = path.join(REPO_ROOT, "public/images/wikipedia-report");
const IMAGE_URL = "/images/wikipedia-report";
const ALT_TEXT_FILE = path.join(REPO_ROOT, "scripts/wikipedia-report/image-alt.json");
const MAX_IMAGE_EDGE = 1600;
const DRAFT_MARKERS = /\b(TODO|TBD|TK|FIXME|XXX)\b|\[citation needed\]|\[(?:cite|ref|link)\??\]/g;
const EXPECTED_PAGES = 14;

function run(cmd, args, options = {}) {
  return execFileSync(cmd, args, { maxBuffer: 512 * 1024 * 1024, encoding: "utf8", ...options });
}

function hasCommand(cmd) {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Images are named by content hash so names survive re-exports of the docx. */
function createImageProcessor(workDir, altText, log) {
  const useMagick = hasCommand("magick");
  if (!useMagick) log.warnings.push("ImageMagick not found: images copied without WebP conversion");
  const done = new Map();
  return (srcPath, location) => {
    if (done.has(srcPath)) return done.get(srcPath);
    const original = fs.readFileSync(srcPath);
    const hash = createHash("sha256").update(original).digest("hex").slice(0, 12);
    const ext = path.extname(srcPath).toLowerCase();
    let bytes = original;
    let outExt = ext;
    if (![".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext) && !useMagick) {
      throw new Error(`${srcPath}: ${ext} images need ImageMagick to convert to a web format`);
    }
    if (useMagick) {
      const tmp = path.join(workDir, `${hash}.webp`);
      const quality = ext === ".png" ? "90" : "85";
      run("magick", [
        srcPath,
        "-auto-orient",
        "-strip",
        "-resize",
        `${MAX_IMAGE_EDGE}x${MAX_IMAGE_EDGE}>`,
        "-quality",
        quality,
        "-define",
        "webp:method=4",
        tmp,
      ]);
      const webp = fs.readFileSync(tmp);
      const originalSize = imageSize(original);
      const tooLarge =
        originalSize && Math.max(originalSize.width, originalSize.height) > MAX_IMAGE_EDGE;
      if (
        webp.length < original.length ||
        tooLarge ||
        ![".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)
      ) {
        bytes = webp;
        outExt = ".webp";
      }
    }
    const size = imageSize(bytes);
    if (!size) throw new Error(`${srcPath}: could not read image dimensions`);
    const name = `${hash}${outExt}`;
    const entry = altText[hash] ?? {};
    const alt = entry.alt ?? "";
    const result = { src: `${IMAGE_URL}/${name}`, alt, width: size.width, height: size.height };
    log.images.push({
      name,
      hash,
      source: path.basename(srcPath),
      bytes: bytes.length,
      originalBytes: original.length,
      location,
      alt,
      decorative: !!entry.decorative,
      ...size,
    });
    done.set(srcPath, result);
    return result;
  };
}

function loadAltText() {
  if (!fs.existsSync(ALT_TEXT_FILE)) return {};
  return JSON.parse(fs.readFileSync(ALT_TEXT_FILE, "utf8"));
}

/** Rewrite the alt-text manifest: keep filled-in alt text, refresh context, drop stale images. */
function saveAltText(altText, images) {
  const out = {};
  for (const img of images) {
    const prev = altText[img.hash] ?? {};
    out[img.hash] = {
      alt: prev.alt ?? "",
      decorative: prev.decorative ?? false,
      context: `${img.location} (docx ${img.source}, published as ${img.name})`,
    };
  }
  fs.writeFileSync(ALT_TEXT_FILE, `${JSON.stringify(out, null, 2)}\n`);
}

/** Render several block lists in one pandoc call, split on marker comments. */
function renderHtml(apiVersion, sections) {
  const blocks = [];
  sections.forEach((section, i) => {
    blocks.push({ t: "RawBlock", c: ["html", `<!--WR-SPLIT-${i}-->`] }, ...section);
  });
  const json = JSON.stringify({ "pandoc-api-version": apiVersion, meta: {}, blocks });
  const html = run("pandoc", ["-f", "json", "-t", "html5", "--wrap=none"], { input: json });
  const parts = html.split(/<!--WR-SPLIT-(\d+)-->\n?/);
  const out = new Array(sections.length).fill("");
  for (let i = 1; i < parts.length; i += 2) out[Number(parts[i])] = parts[i + 1];
  return out;
}

/** Pandoc prints "<h3 id=…>\n6.1.1 Title\n</h3>" for our raw heading tags; tighten it. */
function tightenHeadings(html) {
  return html.replace(/<(h[2-4]) id="([^"]+)">\s*([\s\S]*?)\s*<\/\1>/g, '<$1 id="$2">$3</$1>');
}

function textOf(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function main() {
  const docx = process.argv[2];
  if (!docx || !fs.existsSync(docx)) {
    console.error("Usage: node scripts/wikipedia-report/convert.mjs <path-to-report.docx>");
    process.exit(2);
  }
  if (!hasCommand("pandoc")) {
    console.error(
      "pandoc is required (https://pandoc.org/installing.html); it is only needed locally."
    );
    process.exit(2);
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "wikipedia-report-"));
  try {
    const doc = JSON.parse(
      run("pandoc", [path.resolve(docx), "-t", "json", `--extract-media=${workDir}`], {
        cwd: workDir,
      })
    );
    const log = {
      warnings: [],
      images: [],
      highlights: [],
      crossRefs: { linked: [], unresolved: [], skipped: [] },
    };

    const noteNumbers = numberNotes(doc.blocks);
    const { pages, dropped } = splitIntoPages(doc.blocks, headerText);
    if (pages.length !== EXPECTED_PAGES) {
      throw new Error(
        `Expected ${EXPECTED_PAGES} pages, found ${pages.length}: ${pages.map((p) => p.slug).join(", ")}`
      );
    }
    const index = buildDocumentIndex(doc, pages);
    const altText = loadAltText();
    const ctx = {
      index,
      noteNumbers,
      image: createImageProcessor(workDir, altText, log),
      warn: (msg) => log.warnings.push(msg),
      highlight: (location, text) => log.highlights.push(`${location}: ${text.slice(0, 80)}`),
    };

    const transformed = pages.map((page) => ({ page, ...transformPage(page, ctx) }));
    for (const { page, toc } of transformed) {
      if (page.kind !== "section") continue;
      for (const w of checkNumbering(
        page.number,
        toc.map((e) => e.number)
      ))
        log.warnings.push(`numbering: ${w}`);
    }
    const bodies = renderHtml(
      doc["pandoc-api-version"],
      transformed.map((t) => t.blocks)
    );
    const noteHtml = renderHtml(
      doc["pandoc-api-version"],
      transformed.flatMap((t) => t.notes.map((note) => note.blocks))
    );

    const resolve = { section: index.resolveSection, appendix: index.resolveAppendix };
    const clean = (html) =>
      linkCrossReferences(sanitizeHtml(tightenHeadings(html)), resolve, log.crossRefs);
    let noteCursor = 0;
    const output = transformed.map(({ page, toc, notes }, i) => {
      const renderedNotes = notes.map((note) => ({
        n: note.n,
        html: clean(noteHtml[noteCursor++]),
      }));
      const html = collapseBlankLines(`${clean(bodies[i])}\n${notesSectionHtml(renderedNotes)}`);
      return { slug: page.slug, page: { ...page, toc }, html, notes: notes.length };
    });

    const errors = verifyPages(output);
    const referenced = new Set(
      output.flatMap((o) => [...o.html.matchAll(/<li id="fn-(\d+)"/g)].map((m) => Number(m[1])))
    );
    for (const n of noteNumbers.values()) {
      if (!referenced.has(n))
        log.warnings.push(`note ${n} is not on any page (it sits in dropped draft matter)`);
    }
    if (errors.length) {
      console.error(
        `Verification failed (${errors.length} errors); nothing written:\n  ${errors.join("\n  ")}`
      );
      process.exit(1);
    }

    fs.rmSync(CONTENT_DIR, { recursive: true, force: true });
    fs.rmSync(IMAGE_DIR, { recursive: true, force: true });
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    for (const { slug, page, html } of output) {
      fs.writeFileSync(path.join(CONTENT_DIR, `${slug}.md`), `${frontmatter(page)}\n\n${html}\n`);
    }
    const imageBytes = new Map();
    for (const img of log.images) imageBytes.set(img.name, img);
    for (const [name, img] of imageBytes) {
      const src = path.join(workDir, `${img.hash}.webp`);
      const original = path.join(workDir, "media", img.source);
      fs.copyFileSync(
        name.endsWith(".webp") && fs.existsSync(src) ? src : original,
        path.join(IMAGE_DIR, name)
      );
    }
    saveAltText(altText, log.images);

    report(output, log, dropped, doc);
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

function report(output, log, dropped, doc) {
  const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
  console.log(`Wrote ${output.length} pages to ${path.relative(REPO_ROOT, CONTENT_DIR)}/`);
  for (const o of output)
    console.log(
      `  ${o.slug.padEnd(18)} ${String(o.notes).padStart(3)} notes  ${String(o.page.toc.length).padStart(3)} toc entries`
    );
  console.log(`Dropped headings: ${dropped.join(" | ")}`);

  const total = log.images.reduce((s, i) => s + i.bytes, 0);
  const totalOriginal = log.images.reduce((s, i) => s + i.originalBytes, 0);
  console.log(`\nImages: ${log.images.length}, ${kb(total)} (docx originals ${kb(totalOriginal)})`);
  for (const img of log.images) {
    console.log(
      `  ${img.name.padEnd(18)} ${`${img.width}x${img.height}`.padEnd(10)} ${kb(img.bytes).padStart(7)}  ${img.location}`
    );
  }
  const missingAlt = log.images.filter((i) => !i.alt && !i.decorative);
  if (missingAlt.length) {
    console.log(
      `\nTODO alt text (${missingAlt.length}) — fill in scripts/wikipedia-report/image-alt.json and re-run:`
    );
    for (const img of missingAlt) console.log(`  ${img.hash}  ${img.location}`);
  }

  const markers = [];
  walkAst(doc.blocks, (node) => {
    if (node.t === "Para" || node.t === "Plain") {
      const text = stringify(node.c);
      for (const m of text.matchAll(DRAFT_MARKERS))
        markers.push(`${m[0]}: …${text.slice(Math.max(0, m.index - 50), m.index + 50)}…`);
    }
  });
  const published = output.map((o) => textOf(o.html)).join(" ");
  const live = markers.filter((m) => published.includes(m.split("…")[1].slice(-30)));
  if (live.length)
    console.log(
      `\nPossible draft markers in published text (${live.length}):\n  ${live.join("\n  ")}`
    );
  if (log.highlights.length)
    console.log(
      `\nHighlighted text in the docx, highlight removed (${log.highlights.length}):\n  ${log.highlights.join("\n  ")}`
    );

  const { linked, unresolved, skipped } = log.crossRefs;
  console.log(`\nCross references linked in prose: ${linked.length}`);
  if (unresolved.length)
    console.log(`Unresolved references (left as text): ${unresolved.join(" | ")}`);
  if (skipped.length) console.log(`Skipped (external documents): ${skipped.join(" | ")}`);
  if (log.warnings.length)
    console.log(`\nWarnings (${log.warnings.length}):\n  ${log.warnings.join("\n  ")}`);
}

main();
