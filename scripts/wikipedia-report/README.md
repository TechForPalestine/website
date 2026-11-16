# Wikipedia report converter

Turns the Google Docs export of "Israel is Attacking Wikipedia (to manipulate AI)"
into the committed content behind `/wikipedia-report-2026`:

- `src/content/wikipedia-report/*.md`: one page per section/appendix (collection `wikipediaReport`, `src/content.config.ts`)
- `public/images/wikipedia-report/*`: figures, named by content hash

```bash
node scripts/wikipedia-report/convert.mjs path/to/report.docx
```

Requirements (local only, the site build never runs this): **pandoc 3+** on `PATH`.
**ImageMagick** (`magick`) is optional and converts images to WebP (capped at 1600px)
when that is smaller; without it originals are copied.

Each run deletes and regenerates both output folders, then verifies the result
(14 pages, every footnote ref defined on its page, unique ids, every internal link
resolves, no inline styles/scripts) and exits non-zero without writing if a check fails.

- Structure comes from heading **numbering text** ("6.3.2: …"), not docx heading levels.
- Footnotes keep their document numbers (to match the PDF).
- Draft matter before "Executive Summary", the Table of Contents and "About Tech for Palestine" are dropped.
- Alt text: images have none in the docx. Fill in `alt` (or set `decorative: true`) in
  `image-alt.json`, keyed by image hash, and re-run. The converter lists images still missing alt text.

Pure transforms live in `transform.mjs` / `ast.mjs` with tests alongside (`pnpm test`).
