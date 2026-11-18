# Report index: contents alongside the executive summary

## Intent

On `/wikipedia-report-2026` the full "Contents" list sits below the executive
summary and the influence map, so readers scroll a long way before seeing what
the report covers. The table of contents should appear alongside the summary
from the start, giving an at-a-glance overview and one-click jumps.

## Goals / non-goals

- Goal: contents visible next to the summary on first view (md+, 768px up).
- Goal: on phones, the same sticky "Contents" bar + drawer the section pages use.
- Non-goal: changing the outline component, section pages, or the full-text page.
- Anti-goal: a fourth, index-only contents design.

## Approaches

- **A. Reuse `ReportShell` on the index (chosen).** Same rail/drawer as every
  other reader page; rail lists every entry plus the summary's own headings.
  Small change, consistent behaviour (incl. "Hide contents").
- B. Shell plus a rail that expands every section's subheadings on the index.
  Richer, but a long scrolling rail and a one-page special case in
  `ReportOutline`.
- Dropped: a static column beside the summary. Scrolls away, doesn't match the
  phone drawer, adds a third design.

## Design

In `src/pages/wikipedia-report-2026/index.astro`:

- The header (title, date, Download PDF / Key findings / Read it all) stays
  full width above, unchanged.
- The summary section (heading, prose, influence map) moves inside
  `<ReportShell entries={allEntries} currentSlug={INDEX_SLUG} currentTitle={summary.data.title}>`.
  The summary's top border/padding is adjusted to fit the shell's own spacing.
- The detailed "Contents" list with "Start reading" stays below the summary,
  inside the shell's main column so it lines up with the prose.
- `ReportScripts` is already on the page, so rail toggles, hide/show, the phone
  bar and current-heading tracking work unchanged.

## Left to the builder

Exact spacing tweaks (top padding between header and shell, removing the
duplicate `container` wrappers inside the shell), verified visually by the user.
