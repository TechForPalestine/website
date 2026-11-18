# Wikipedia Report Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the report's read button bigger, make the long reader pages cheaper to render, add a one-page full text, launch the report to search engines, and promote it with a homepage popup that never collides with the November challenge popup.

**Architecture:** Pure, Vitest-tested helpers (link rewriting, popup decision logic) sit next to thin Astro components, following the existing split between `reportNav.ts`/`reportData.ts` and between `challengePopup.ts`/`ChallengePopup.astro`. The full-text page reuses the reader shell and content collection and rewrites cross-page links to in-page anchors at render time. The popup is a native `<dialog>` modelled on `ChallengePopup.astro`.

**Tech Stack:** Astro 5 SSR (Cloudflare), TypeScript, Tailwind, Vitest (node env), `@astrojs/sitemap`, Plausible.

**Spec:** `docs/superpowers/specs/2026-11-18-wikipedia-report-followups-design.md`

## Global Constraints

- Use pnpm only. Tests: `pnpm test <path>` (Vitest, node environment, `*.test.ts` colocated with the code).
- Gate for every task: `pnpm lint && pnpm check && pnpm test` passes. Don't run `pnpm build`, `pnpm dev`, prettier, or load or curl any page. The user verifies in a Cloudflare preview.
- Don't commit. Work on branch `feat/wikipedia-report-followups` (create it from `main` in Task 1). The user commits and opens a PR with "ship it".
- CSP: no `style=""` attributes, no inline event handlers, no new external origins. Client code goes in bundled `<script>` blocks.
- Never hand-edit `src/content/wikipedia-report/*.md`. `scripts/wikipedia-report/convert.mjs` regenerates them.
- Design classes come from `src/utils/designClasses.ts`. Report prose styles live in `src/styles/wikipedia-report.css` under `.report-prose`.
- Full-text route: `/wikipedia-report-2026/full`. Popup storage key: `t4p-wikipedia-report-popup`. Report-after-challenge gap: 12 hours.
- Plausible event names: `Wikipedia Report Read Online` (existing, prop `location`), `Report Popup Shown`, `Report Popup CTA Click` (`cta: read | pdf`), `Report Popup Dismissed` (`reason`).

## Review Focus

1. **Anchor jumps under `content-visibility: auto`.** A jump to `#s6-3-2` or a footnote, from a link or a pasted URL, must land on the right heading even after skipped sections above it are measured late. Mitigated with `contain-intrinsic-size: auto <n>` (the `auto` keyword remembers real sizes). A static test asserts the CSS rule includes `auto` (Task 3).
2. **Corrupt or blocked localStorage.** The popup must not throw and must not show repeatedly in a loop. Tested in Task 5 (`parseReportPopupState` with junk input).
3. **A visitor who closed the challenge a minute ago, then returns to the homepage.** No report popup until 12 hours have passed. Tested in Task 5.
4. **Cross-reference links on the full page that point at entries or anchors not in the report** (or off-site links) stay untouched. Tested in Task 2.
5. **Printing the full page.** Off-screen sections must still print. A static test asserts the print media rule resets `content-visibility` (Task 3).

---

### Task 1: Bigger "Read the report online" button

**Files:**

- Modify: `src/utils/designClasses.ts` (next to `primaryButton`, around line 43)
- Modify: `src/pages/wikipedia-report.astro:119-122`

**Interfaces:**

- Produces: `export const primaryButtonLarge: string` in `designClasses.ts`

- [ ] **Step 1:** `git switch -c feat/wikipedia-report-followups`
- [ ] **Step 2:** Add `primaryButtonLarge`: the same colors and focus ring as `primaryButton` (`bg-grove text-white hover:bg-grove-hover`, built on the same base as `pill`), with `min-h-[56px]`, `px-8` and `text-[18px] min-[810px]:text-[19px]`. Check how `pillBase` sets height, padding and font size. If those are baked into `pillBase`, add a sibling `pillLargeBase` instead of overriding classes.
- [ ] **Step 3:** On the hero link (line 119), use `primaryButtonLarge` and change the icon to `class="h-5 w-5"`. Leave the PDF ghost button and the second read button (line 209) unchanged.
- [ ] **Step 4:** Run `pnpm lint && pnpm check`. Expected: no new errors.

### Task 2: Link rewriter and full-text path

**Files:**

- Modify: `src/utils/wikipediaReportLinks.ts`
- Create: `src/components/wikipedia-report/fullText.ts`
- Test: `src/components/wikipedia-report/fullText.test.ts`

**Interfaces:**

- Produces, in `wikipediaReportLinks.ts`: `export const REPORT_FULL_PATH = "/wikipedia-report-2026/full"`
- Produces, in `fullText.ts` (no `astro:content` import):
  - `rewriteLinksForFullPage(html: string, slugs: ReadonlySet<string>): string`
  - `splitAtMapAnchor(html: string): [string, string] | null`. This is the logic moved out of `src/pages/wikipedia-report-2026/index.astro` (anchor `'<h2 id="claims-in-brief">'`; returns `null` if the anchor is missing or at index 0). Export `MAP_ANCHOR` too.

- [ ] **Step 1: Write the failing tests**

```ts
const slugs = new Set(["executive-summary", "section-4", "section-6", "appendix-e"]);

test("section anchor link becomes in-page anchor", () => {
  expect(
    rewriteLinksForFullPage('<a href="/wikipedia-report-2026/section-6#s6-3-2">x</a>', slugs)
  ).toBe('<a href="#s6-3-2">x</a>');
});
test("whole-entry link points at the entry section id", () => {
  expect(rewriteLinksForFullPage('<a href="/wikipedia-report-2026/appendix-e">x</a>', slugs)).toBe(
    '<a href="#appendix-e">x</a>'
  );
});
test("bare index link points at the executive summary", () => {
  expect(rewriteLinksForFullPage('<a href="/wikipedia-report-2026">x</a>', slugs)).toBe(
    '<a href="#executive-summary">x</a>'
  );
});
test("unknown slug, external and plain anchors are untouched", () => {
  const html =
    '<a href="/wikipedia-report-2026/section-9#s9-1">a</a><a href="https://en.wikipedia.org/x">b</a><a href="#fn-91">c</a><a href="/wikipedia-report">d</a>';
  expect(rewriteLinksForFullPage(html, slugs)).toBe(html);
});
test("rewrites every occurrence", () => {
  const html =
    '<a href="/wikipedia-report-2026/section-4">a</a> <a href="/wikipedia-report-2026/section-4#s4-1">b</a>';
  expect(rewriteLinksForFullPage(html, slugs)).toBe(
    '<a href="#section-4">a</a> <a href="#s4-1">b</a>'
  );
});
test("splitAtMapAnchor splits before the claims heading", () => {
  expect(splitAtMapAnchor('<p>a</p><h2 id="claims-in-brief">C</h2>')).toEqual([
    "<p>a</p>",
    '<h2 id="claims-in-brief">C</h2>',
  ]);
  expect(splitAtMapAnchor("<p>a</p>")).toBeNull();
});
```

- [ ] **Step 2:** Run `pnpm test src/components/wikipedia-report/fullText.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement both functions. Use one regex over `href="/wikipedia-report-2026(?:/([a-z0-9-]+))?(?:#([\w-]+))?"`. Leave the match unchanged when the slug isn't in `slugs`. Build the prefix from `REPORT_BASE_PATH`, not a literal.
- [ ] **Step 4:** In `index.astro`, replace the inline `MAP_ANCHOR`/`indexOf` split with `splitAtMapAnchor(summary.body ?? "")`. Behavior stays the same.
- [ ] **Step 5:** Run `pnpm test src/components/wikipedia-report/fullText.test.ts && pnpm check`. Expected: PASS.

### Task 3: Rendering speed (content-visibility)

**Files:**

- Modify: `src/styles/wikipedia-report.css` (add near the prose rules; adjust the existing `@media print` block at line 416)
- Test: `src/styles/wikipediaReportCss.test.ts`

**Interfaces:**

- Produces: CSS class `.report-cv` (applied by Task 4 to each full-page entry `<section>`). The rule also applies to `.report-prose > *` blocks that are large: tables, figures and lists.

- [ ] **Step 1: Write the failing test.** Read the CSS file with `fs` and assert:
  - It contains a rule for `.report-cv` with `content-visibility: auto` and `contain-intrinsic-size: auto` followed by a length.
  - Inside `@media print`, `.report-cv` is set to `content-visibility: visible`.
- [ ] **Step 2:** Run `pnpm test src/styles/wikipediaReportCss.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Add `.report-cv { content-visibility: auto; contain-intrinsic-size: auto 2000px; }`. Also add `content-visibility: auto; contain-intrinsic-size: auto 400px;` for `.report-prose > table, .report-prose > figure, .report-prose > ol, .report-prose > ul` (the footnote list in section 6 is the biggest block). Add both selectors to `@media print` with `content-visibility: visible`. Don't apply this to headings or paragraphs: anchor targets must stay in flow.
- [ ] **Step 4:** Run the test. Expected: PASS. Then run `pnpm lint`.

### Task 4: Full-text page and entry points

**Files:**

- Create: `src/pages/wikipedia-report-2026/full.astro`
- Modify: `src/components/wikipedia-report/ReportOutline.astro` (new optional prop)
- Modify: `src/components/wikipedia-report/ReportScripts.astro` (read-click tracking)
- Modify: `src/pages/wikipedia-report-2026/index.astro` (header button)
- Modify: `src/pages/wikipedia-report-2026/[slug].astro` (small link)
- Modify: `src/pages/wikipedia-report.astro` (text link under the hero buttons)

**Interfaces:**

- Consumes: `REPORT_FULL_PATH`, `rewriteLinksForFullPage`, `splitAtMapAnchor` (Task 2); `.report-cv` (Task 3); `getReportEntries()`, `ReportEntryMeta`, `INDEX_SLUG`, `entryFullTitle` (existing).
- Produces: `ReportOutline` prop `mode?: "pages" | "single"` (default `"pages"`). In `"single"` mode, every entry link is `#<slug>` and every heading link is `#<id>`. Headings are listed under _every_ entry, not just the current one. `currentSlug` is ignored. The sidebar variant keeps `data-report-outline`, so the existing highlighter works.

- [ ] **Step 1:** Add `mode` to `ReportOutline.astro` as described above. Existing callers stay unchanged.
- [ ] **Step 2:** Build `full.astro` from the `[slug].astro` shell: sidebar and mobile `<details>` outline (both `mode="single"`), no pager, the same `TerminalCta`, and `<ReportScripts />`.
  - Get the entries with `getReportEntries()` and their raw HTML with `getEntry("wikipediaReport", slug).body`.
  - For each entry, render `<section id={slug} class="report-cv" aria-labelledby={`${slug}-title`}>` with an `<h2 id={`${slug}-title`}>` showing the label overline and title, then `<div class="report-prose"><Fragment set:html={rewriteLinksForFullPage(body, slugSet)} /></div>`.
  - For the executive summary, use `splitAtMapAnchor` and place `<InfluenceMap />` between the parts, falling back to after the summary (same as the index).
  - Render exactly one `<NewTabHint />`, at the end.
  - Page `<h1>`: `{READER_TITLE}` plus `READER_SUBTITLE`, overline "Full report".
  - Title: `` `Full text - ${READER_TITLE} - Tech for Palestine` ``. Description: "The whole report on one page, so you can search it." No `noindex` prop. Add a comment saying this route is excluded from the sitemap in `astro.config.mjs`.
  - Add the same "server-rendered, do not prerender" comment as the other reader pages.
- [ ] **Step 3:** In `ReportScripts.astro`, add the `[data-track-report-read]` click handler. It must match `src/pages/wikipedia-report.astro:444-450` exactly: event `Wikipedia Report Read Online`, prop `location`.
- [ ] **Step 4:** Add the entry points (all `href={REPORT_FULL_PATH}`):
  - Reader index header: a `ghostButton` reading "Read it all on one page", with `data-track-report-read="reader-index-full"`.
  - `[slug].astro` header: below the `<h1>`, a small `inlineLink`-style link reading "View the whole report on one page", with `data-track-report-read="section-full"`.
  - Landing page: below the hero buttons (after line 132), a `text-[15px]` line reading "Prefer one long page? Read the full text", with `data-track-report-read="hero-full"`.
- [ ] **Step 5:** Run `pnpm lint && pnpm check && pnpm test`. Expected: PASS. Then grep `full.astro` to confirm it contains no `style=` attributes.

### Task 5: Report popup decision logic

**Files:**

- Create: `src/utils/reportPopup.ts`
- Test: `src/utils/reportPopup.test.ts`

**Interfaces:**

- Consumes, from `src/utils/challengePopup.ts`: `isCampaignLive`, `type PopupState` (the shape `{ dismissedAt: number } | null`), `hasReachedScrollTrigger`, `SHOW_DELAY_MS`, `parsePopupState`.
- Produces:
  - `STORAGE_KEY = "t4p-wikipedia-report-popup"`
  - `REPORT_AFTER_CHALLENGE_GAP_MS = 12 * 60 * 60 * 1000`
  - `REPORT_SHOWN_ATTRIBUTE = "data-report-popup-shown"`, `REPORT_SHOWN_EVENT = "t4p:report-popup-shown"`
  - `isReportPopupLive(): boolean` (returns `true`)
  - `readReportPopupState(storage: Pick<Storage, "getItem"> | null): PopupState` and `writeReportPopupState(storage: Pick<Storage, "setItem"> | null, state: { dismissedAt: number }): void`. Both swallow storage errors like the challenge versions and reuse `parsePopupState`.
  - `shouldShowReportPopup(args: { report: PopupState; challenge: PopupState; now: number }): boolean`
  - `type ReportPopupCta = "read" | "pdf"`, `type ReportDismissReason = "close" | "escape" | "backdrop" | ReportPopupCta`

- [ ] **Step 1: Write the failing tests** (with `CAMPAIGN_ENDS_AT` imported from `challengePopup.ts`; `H = 3_600_000`):

```ts
const during = CAMPAIGN_ENDS_AT - 5 * 24 * H;
const after = CAMPAIGN_ENDS_AT + H;

test("never shows once the report popup was dismissed", () => {
  expect(shouldShowReportPopup({ report: { dismissedAt: 1 }, challenge: null, now: after })).toBe(
    false
  );
});
test("stands aside while the challenge popup is still going to show", () => {
  expect(shouldShowReportPopup({ report: null, challenge: null, now: during })).toBe(false);
});
test("waits 12h after the challenge was dismissed", () => {
  expect(
    shouldShowReportPopup({ report: null, challenge: { dismissedAt: during - H }, now: during })
  ).toBe(false);
  expect(
    shouldShowReportPopup({
      report: null,
      challenge: { dismissedAt: during - 13 * H },
      now: during,
    })
  ).toBe(true);
});
test("shows after the campaign for visitors who never saw the challenge", () => {
  expect(shouldShowReportPopup({ report: null, challenge: null, now: after })).toBe(true);
});
test("the 12h gap still applies just after the campaign ends", () => {
  expect(
    shouldShowReportPopup({ report: null, challenge: { dismissedAt: after - H }, now: after })
  ).toBe(false);
});
test("corrupt or blocked storage reads as never dismissed", () => {
  expect(readReportPopupState({ getItem: () => "{not json" })).toBeNull();
  expect(
    readReportPopupState({
      getItem: () => {
        throw new Error("blocked");
      },
    })
  ).toBeNull();
  expect(() =>
    writeReportPopupState(
      {
        setItem: () => {
          throw new Error("full");
        },
      },
      { dismissedAt: 1 }
    )
  ).not.toThrow();
});
```

- [ ] **Step 2:** Run `pnpm test src/utils/reportPopup.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the module. The order in `shouldShowReportPopup`: not live → false; `report !== null` → false; `isCampaignLive(now) && challenge === null` → false; `challenge && now - challenge.dismissedAt < REPORT_AFTER_CHALLENGE_GAP_MS` → false; otherwise true.
- [ ] **Step 4:** Run the tests. Expected: PASS.

### Task 6: Homepage report popup

**Files:**

- Create: `src/components/home/ReportPopup.astro`
- Modify: `src/pages/index.astro` (import, and mount after `<ChallengePopup />` at line 493)
- Modify: `src/components/home/NewsletterPopup.tsx` (stand down for the report too, around lines 102-122)

**Interfaces:**

- Consumes: everything Task 5 produces. From `src/utils/challengePopup.ts`: `readPopupState` (challenge state), `hasReachedScrollTrigger`, `SHOW_DELAY_MS`. From `src/utils/newsletterPopup.ts`: `safeLocalStorage`. From `src/data/wikipediaReport.ts`: `REPORT_TITLE`, `REPORT_SUMMARY`, `REPORT_READ_HREF`, `REPORT_PDF`.

- [ ] **Step 1:** Build `ReportPopup.astro`. Copy the structure, CSS approach and dialog behavior of `ChallengePopup.astro`: a `<dialog id="report-popup" aria-labelledby="rp-title">`, scoped `rp-` classes, a centred card on desktop and a bottom sheet under 640px, a close button, a backdrop click that requires the press to have started on the backdrop, and Esc. Contents, in order:
  - `<img src="/images/wikipedia-report/influence-map.webp" width="1840" height="1440" alt="Map of who is trying to shape what AI learns through Wikipedia" loading="lazy" decoding="async">`, cropped to a fixed-height banner with `object-fit: cover`
  - Overline "New report · Tech for Palestine"
  - `<h2 id="rp-title">{REPORT_TITLE}</h2>`
  - `REPORT_SUMMARY`, clamped to 3 lines
  - Actions: "Read the report" → `REPORT_READ_HREF` (`data-rp-cta="read"`), and "Download PDF" → `REPORT_PDF.href` with `download` (`data-rp-cta="pdf"`)

  Render the dialog only when `isReportPopupLive()`.

- [ ] **Step 2:** In the component's `<script>`: if `shouldShowReportPopup({ report: readReportPopupState(ls), challenge: readPopupState(ls), now: Date.now() })`, schedule with the same 8s / 25%-scroll trigger as the challenge.
  - On open: call `showModal()`, set `REPORT_SHOWN_ATTRIBUTE` on `<html>`, dispatch `REPORT_SHOWN_EVENT`, and track `Report Popup Shown`.
  - Every close path writes `writeReportPopupState(ls, { dismissedAt: Date.now() })` and tracks `Report Popup Dismissed` with `reason`.
  - CTA clicks track `Report Popup CTA Click` with `cta`.
  - As a defensive check, also skip opening if `<html>` already has the challenge's `SHOWN_ATTRIBUTE`.
- [ ] **Step 3:** In `NewsletterPopup.tsx`, make the stand-down react to the report popup the same way it reacts to the challenge popup: check `REPORT_SHOWN_ATTRIBUTE` in the initial state and listen for `REPORT_SHOWN_EVENT`. Rename `challengeShown` to `otherPopupShown` if that reads more clearly.
- [ ] **Step 4:** Mount `<ReportPopup />` in `index.astro` after `<ChallengePopup />`.
- [ ] **Step 5:** Run `pnpm lint && pnpm check && pnpm test`. Expected: PASS. Grep the new component for `style=` and `onclick=`. Expected: none.

### Task 7: Launch to search engines

**Files:**

- Modify: `src/pages/wikipedia-report.astro:91-95`, `src/pages/wikipedia-report-2026/index.astro:86-88`, `src/pages/wikipedia-report-2026/[slug].astro:62-64`
- Modify: `src/data/wikipediaReport.ts:8` (the launch comment only)
- Modify: `astro.config.mjs` (inside `sitemap()`, lines 119-173)
- Test: `src/utils/reportSitemap.test.ts`
- Create: `src/utils/reportSitemap.mjs` (plain `.mjs` so `astro.config.mjs` can import it)

**Interfaces:**

- Produces: `reportSitemapPages(site: string, contentDir: string): string[]`. It reads `*.md` filenames in `contentDir` and returns `${site}/wikipedia-report`, `${site}/wikipedia-report-2026`, and `${site}/wikipedia-report-2026/<slug>` for every slug except `executive-summary`, with no trailing slashes.

- [ ] **Step 1: Write the failing test.** Call `reportSitemapPages("https://techforpalestine.org", "src/content/wikipedia-report")` and assert:
  - It includes `https://techforpalestine.org/wikipedia-report-2026/section-6` and `https://techforpalestine.org/wikipedia-report-2026/appendix-e`.
  - It doesn't include any URL ending in `executive-summary` or `/full`.
  - No URL ends with `/`.
  - Its length is 2 + 12 = 14.
- [ ] **Step 2:** Run `pnpm test src/utils/reportSitemap.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `reportSitemapPages` with `node:fs` `readdirSync`, sorted.
- [ ] **Step 4:** Update `astro.config.mjs`:
  - Remove `"/wikipedia-report/"` and its comment from `exclude`.
  - Change `excludeTrees` to `[]` and drop its comment, or remove the tree logic if nothing else uses it.
  - Add `"/wikipedia-report-2026/full"` handling so the full page is never listed. With no trailing slash it needs an `endsWith("/wikipedia-report-2026/full")` check alongside the existing ones.
  - Pass `customPages: reportSitemapPages(SITE, "src/content/wikipedia-report")`.

  Check whether the sitemap integration already lists the two static routes. If it does, dedupe so each URL appears once (filter `customPages` against what the integration emits, or rely on the integration's dedupe if the docs confirm it).

- [ ] **Step 5:** Remove the `noindex` prop and the "noindex until…" HTML comments from the three pages. Update the comment in `wikipediaReport.ts:8` so it no longer says the page is noindex. Keep the `TODO(comms)` content items.
- [ ] **Step 6:** Run `pnpm lint && pnpm check && pnpm test`. Expected: PASS. Then run `grep -rn "noindex" src/pages/wikipedia-report*`. Expected: no matches.

---

## Final gate

- [ ] Run `pnpm lint && pnpm check && pnpm test`. Expected: all pass.
- [ ] Whole-branch review against the spec, and a security pass on CSP: no inline styles or handlers, and the popup's storage and tracking handle failures safely.
- [ ] Hand off to the user with the preview checks: hero button size, `/wikipedia-report-2026/full` (Ctrl+F, anchor jumps, print preview), popup ordering (clear `t4p-challenge-2026-11-popup` and `t4p-wikipedia-report-popup` in localStorage to retest), and `sitemap-0.xml` contents.
