# Wikipedia report follow-ups: bigger read button, speed, full-text page, homepage popup

Date: 2026-11-18. Status: approved by the user (popup option c; ship the popup live; launch the report to search engines; speed limited to safe client-side work).

## Intent

Reader feedback on the Wikipedia report (`/wikipedia-report` landing page, `/wikipedia-report-2026` online reader):

> Website looks good but: it's slightly slow. You can't search. Could we add a page with the whole text for people who prefer?

On top of that, the user wants to (1) make "Read the report online" more prominent, and (2) promote the report from the homepage with a popup that uses the report's existing image.

Success means reading online is the obvious action on the landing page, the reader feels smooth even on the longest sections, anyone can Ctrl+F the whole report on one page, and homepage visitors hear about the report without getting two popups in one visit.

## Goals

1. Larger "Read the report online" button in the landing-page hero.
2. Make the reader noticeably faster, fixing the causes visible in the code.
3. A single page with the whole report, searchable with the browser's find.
4. A homepage popup for the report, using the influence map image, live from day one.
5. Launch the report to search engines: remove `noindex` and the sitemap exclusions from `/wikipedia-report` and `/wikipedia-report-2026/*`.

## Non-goals

- A custom search UI or search index. Browser find on the full page is what was asked for.
- Edge caching or prerendering of report pages. Pages are `private` because of the nav A/B test (`src/components/Navigation.astro`), and CSP nonces are injected per request (`src/middleware/csp.ts`). `[slug].astro` explicitly says not to prerender.
- Changing the reader's URL scheme or splitting sections into more pages.
- Measuring the live site. The user verifies pages themselves, so the agent does not load or curl pages or start the dev server.

## Anti-goals

- Two popups in one page load, or a report popup right after the visitor closed the challenge popup.
- Anything that breaks CSP: no `style=""` attributes, no `'unsafe-inline'`, no new external script origins.
- Duplicate-content signals: the full-text page must not compete with the section pages in search (see design 3: canonical stays self, but it is excluded from the sitemap; the section pages are the indexable units).
- Editing generated content in `src/content/wikipedia-report/*.md` by hand. `scripts/wikipedia-report/convert.mjs` rewrites those files.

## Constraints

- Astro SSR on Cloudflare. Only module scripts bundled by Astro carry the CSP nonce, so inline handlers are out.
- Design classes come from `src/utils/designClasses.ts` (`pill`, `primaryButton`, …). Report prose styles are in `src/styles/wikipedia-report.css`, scoped under `.report-prose`.
- URL scheme helpers: `src/utils/wikipediaReportLinks.ts`. Heading ids (`s6-3-2`) and footnote ids (`fnref-91`, `fn-91`) are unique across the whole report, so the sections can be concatenated without id clashes.
- Report content is about 730 KB of HTML-in-markdown across 13 entries. Section 6 alone is 220 KB. There are 33 images, already `loading="lazy"` with width/height.
- Tests: Vitest in the node environment, colocated `*.test.ts`. Keep pure logic in DOM-free modules (the pattern in `src/utils/challengePopup.ts`).
- Project rules: pnpm only. No unsolicited builds, prettier runs or dev server. No commits until the user says "ship it".

## Approaches considered

**Speed**

- _A. Safe client-side rendering work (picked by the user)._ Add `content-visibility: auto` with `contain-intrinsic-size` so off-screen content isn't laid out or painted. Low risk, nothing visible changes. Note: the outline highlighter in `ReportScripts.astro` is already IntersectionObserver-driven (the builder check corrected an earlier claim), so it is not rewritten. This improves scrolling and rendering on long pages; it is not expected to change server response time.
- _A2. Measure live pages first._ Offered; the user did not take it up.
- _B. Edge-cache or prerender report pages._ Biggest server-side win, but it conflicts with the per-request nav experiment and CSP nonces. Rejected for now.
- _C. Split large sections into more pages._ Changes URLs and links and works against the "whole text" request. Rejected.

**Full-text page**

- _A. One SSR page rendering every entry in order (picked)._ Simple, and it reuses the content collection and prose styles.
- _B. Custom search over the split pages._ More code, and not what the reader asked for. Rejected.
- _C. Full text as a chunked or lazy-loaded page._ Breaks Ctrl+F for content that hasn't loaded yet. Rejected.

**Popup ordering (decided by the user: option c)**

- a) The report replaces the challenge popup now.
- b) The challenge keeps the slot until it ends on 1 December.
- **c) Visitors who already saw the challenge get the report on a later visit; never two in one visit (picked).**

## Design

### 1. Bigger read button

- Add a large pill variant in `src/utils/designClasses.ts` (e.g. `pillLarge` / `primaryButtonLarge`): taller (about 56px min-height), larger text (about 18–19px) and more horizontal padding. Same colors and focus ring as `primaryButton`.
- Use it on the hero "Read the report online" link (`src/pages/wikipedia-report.astro:119`), with the icon bumped from `h-4 w-4` to `h-5 w-5`. The PDF ghost button keeps its current size, so reading online reads as the primary action.
- _Builder's call:_ exact sizes, as long as they fit the design system in `DESIGN.md`. The second "Read the report online" button under the findings (line 209) stays as it is.

### 2. Speed

- Leave the outline highlighter alone: it already uses `IntersectionObserver`. On the full-text page it must still work (many more headings, same code path).
- Add `content-visibility: auto; contain-intrinsic-size: auto 600px;` (values are the builder's call) to direct children of `.report-prose` that are large, or to per-entry wrappers on the full page. Must not break in-page anchor jumps (`#s6-3-2`, footnotes) or printing. `content-visibility` is skipped in print via `@media print { … visible }`.
- Keep `loading="lazy"` on images. No other changes.

### 3. Full-text page

- Route: `/wikipedia-report-2026/full` (`src/pages/wikipedia-report-2026/full.astro`). `[slug].astro` already 404s unknown slugs, and a static route takes precedence over the dynamic one, so no conflict. Add a `fullTextHref()` / `REPORT_FULL_PATH` to `wikipediaReportLinks.ts`.
- Renders every entry from `getReportEntries()` in order (executive summary first). Each entry goes in its own `<section>` with the entry's label and title as an `<h2>`, and its own id (the entry slug, e.g. `id="section-6"`), so per-entry anchors work.
- The influence map is included where the reader index puts it (before "Our Claims in Brief" in the executive summary), reusing the same split logic. _Builder's call:_ lift that split into a shared helper rather than duplicating it.
- **Link rewriting:** the content's 201 cross-references are absolute (`/wikipedia-report-2026/section-6#s6-3`, `/wikipedia-report-2026/appendix-e`). On the full page they become in-page links: `#s6-3`, or `#section-6` / `#appendix-e` for whole-entry links. Do this at render time with a pure, unit-tested function over the entry HTML (`entry.body`), not by editing the generated markdown. Links whose target isn't in the report stay unchanged.
- Layout: same shell as `[slug].astro`, i.e. the sticky sidebar outline on desktop and a disclosure on mobile. The outline links to in-page anchors for all entries. The outline component may need a mode where hrefs are `#id` instead of the per-page URLs. No prev/next pager.
- One `NewTabHint` on the page (its id must stay unique).
- Indexable (no `noindex`), self-canonical, but excluded from the sitemap so the section pages stay the primary search results (_my call_).
- Entry points:
  - Reader index (`index.astro`) header: a ghost button or link, "Read the full report on one page".
  - Landing page (`wikipedia-report.astro`): a text link under the hero buttons, "Prefer one long page? Read the full text".
  - Section pages: a small "View as one page" link in the outline or header. _Builder's call_ on the exact placement.
  - Plausible: reuse `data-track-report-read` with location values like `full-text-hero`. Today the click handler only exists inline in `src/pages/wikipedia-report.astro`, so add the same handler to `ReportScripts.astro` for the reader pages.
- Headings (_my call_): entry titles are `<h2>` in a distinct entry-title style, and the content's own `<h2>`/`<h3>` stay as they are. This flattens the structure slightly but avoids restyling `.report-prose` or rewriting heading levels.

### 4. Homepage report popup

- New `src/components/home/ReportPopup.astro`, modelled on `ChallengePopup.astro`: native `<dialog>`, centred card on desktop and a bottom sheet on phones, close button, backdrop click, Esc. Styles are in the component's own `<style>` (no inline style attributes).
- Content: the influence map image (`/images/wikipedia-report/influence-map.webp`, with alt text summarising it as "Map of who is trying to shape what AI learns through Wikipedia"), an overline ("New report"), the report title (`REPORT_TITLE` from `src/data/wikipediaReport.ts`), a one-line summary, and two actions: **Read the report** (primary, `REPORT_READ_HREF`) and **Download PDF** (ghost, `REPORT_PDF.href`, `download`).
- Pure logic in `src/utils/reportPopup.ts` (tested), mirroring `challengePopup.ts`: its own storage key (`t4p-wikipedia-report-popup`), `parse/read/writePopupState`, and the same trigger (8s or 25% scroll, reusing `hasReachedScrollTrigger`).
- **Ordering rule (option c):** on a page load, the report popup is eligible only if all of these hold:
  1. The report popup has never been dismissed.
  2. The challenge popup is _not_ going to show on this load: the campaign is over, or the challenge has already been dismissed.
  3. If the challenge was dismissed, it was at least `REPORT_AFTER_CHALLENGE_GAP_MS` ago. _My call: 12 hours_, so closing the challenge and then reloading or returning to the homepage doesn't immediately show a second popup.

  The newsletter popup stands down when the report popup shows, the same way it does for the challenge. Generalize the existing `SHOWN_ATTRIBUTE` / `SHOWN_EVENT` handshake in `NewsletterPopup.tsx`, or add a parallel one for the report. _Builder's call_, but the newsletter must never open on a load where the report popup opened.

- Mounted in `src/pages/index.astro` next to `<ChallengePopup />`.
- Plausible events mirroring the challenge popup: `Report Popup Shown`, `Report Popup CTA Click` (`cta: read | pdf`), `Report Popup Dismissed` (`reason`).
- Live now (user decision). No end date; shows until dismissed. _My call:_ an `isReportPopupLive()` helper returning true gives one switch to turn it off later.

### 5. Launch to search engines

- Remove `noindex` from `src/pages/wikipedia-report.astro`, `src/pages/wikipedia-report-2026/index.astro` and `[slug].astro`, and delete the "noindex until launch" comments there and in `src/data/wikipediaReport.ts` (keep the remaining `TODO(comms)` content items themselves).
- In `astro.config.mjs` `sitemap()`: remove `/wikipedia-report/` from `exclude`, and replace the `/wikipedia-report-2026/` tree exclusion with an exclusion of just `/wikipedia-report-2026/full`.
- The reader's section pages are SSR dynamic routes, which `@astrojs/sitemap` does not list by itself. Add them via `customPages` (built from the files in `src/content/wikipedia-report/`, excluding `executive-summary`, which is the index), with no trailing slash to match the existing `serialize`.
- Check whether `/wikipedia-report` and `/wikipedia-report-2026` are listed (static routes in SSR mode may also need `customPages`); add whatever is missing.

## Testing

- Unit tests (Vitest): link rewriter (section, sub-section, appendix and external links; already-relative anchors), report popup decision logic (each ordering case, including the 12h gap and the campaign being over), parsing corrupt storage, and the extracted outline/heading helper if one is added.
- `pnpm lint && pnpm check && pnpm test` must pass. No builds or dev server unless the user asks. The user verifies pages and the CSP in a Cloudflare preview.

## Left to the builder

Exact button sizes, `contain-intrinsic-size` values, where the "View as one page" link sits on section pages, popup copy wording within the constraints above, and whether the newsletter handshake is generalized or duplicated.
