# Report Index Contents Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the report's contents rail alongside the executive summary on `/wikipedia-report-2026`.

**Architecture:** Wrap the index page's summary and its bottom "Contents" section in the existing `ReportShell` (rail on md+, phone bar + drawer below md), with `currentSlug={INDEX_SLUG}`. Header stays full width above. No changes to shared components.

**Tech Stack:** Astro 5, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-18-report-index-toc-design.md`

## Global Constraints

- No inline `style=""` attributes (CSP).
- Do not modify `ReportShell`, `ReportOutline`, `ReportScripts`, `[slug].astro` or `full.astro`.
- Do not start the dev server or reformat unrelated files; the user verifies visually.

## Review Focus

- `ReportShell` already provides `container`; nested `container` wrappers inside it would double the gutter and misalign the summary — remove them.
- The shell's `entries` must be the full list (including the summary) so the rail marks "Executive Summary" as current; the bottom `ReportContents` keeps `rest` (summary excluded).
- Heading IDs in the summary must still be picked up by the rail's current-heading tracking (`data-toc-link` ↔ heading `id`); no markup changes to the summary prose.
- Print: `report-no-print` on the bottom contents section stays.
- The `summaryParts` null fallback branch must render inside the shell too.

---

### Task 1: Wrap the index summary in ReportShell

**Files:**

- Modify: `src/pages/wikipedia-report-2026/index.astro`

**Interfaces:**

- Consumes: `ReportShell` props `{ entries: ReportEntryMeta[]; currentSlug: string; currentTitle: string }`; `getReportEntries()`; `INDEX_SLUG`.

- [ ] **Step 1:** Import `ReportShell`; compute `const entries = await getReportEntries();` and derive `rest` from it (no second fetch).
- [ ] **Step 2:** Replace the summary `<section>` and the contents `<section>` outer wrappers with one `<ReportShell entries={entries} currentSlug={INDEX_SLUG} currentTitle={summary.data.title}>` containing both sections. Drop their `<div class={container}>` wrappers and the summary's `border-t … pt-12/pt-14` (the shell supplies top spacing); keep `max-w-[45rem]`, ids and `aria-labelledby`.
- [ ] **Step 3:** Update the file's header comment to say the summary sits in the reader shell.
- [ ] **Step 4:** Run `pnpm lint && pnpm check && pnpm test`. Expected: no errors.
- [ ] **Step 5:** Commit on a new branch:

```bash
git checkout -b feat/report-index-contents-rail
git add src/pages/wikipedia-report-2026/index.astro docs/superpowers/specs/2026-11-18-report-index-toc-design.md docs/superpowers/plans/2026-11-18-report-index-toc.md
git commit -m "feat(wikipedia-report): contents rail alongside the executive summary"
```
