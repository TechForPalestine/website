# Wikipedia report reader: collapsible contents sidebar

Date: 2026-11-18. Status: approved by the user ("yes go ahead", hide button included).

## Why

Readers on a half-width window or a tablet (768–1023px) get only a "Contents +" bar above the article. The real sidebar appears only from 1024px. The team wants a professional contents sidebar on the left, collapsible, in the style of Wikipedia's Vector 2022 layout and documentation sites.

## Approaches considered

- **Sidebar from 768px + phone drawer + hide toggle (picked).** This is the standard documentation and Wikipedia pattern. NN/g warns that hidden contents lists go unnoticed, so the rail is visible by default and hiding it is the reader's choice.
- **Keep the top disclosure on narrow screens, only restyle it.** Rejected: it is what the team asked to replace.
- **Right-rail "on this page" list plus left section nav.** Rejected: there is no room at 768–1023px, and it duplicates the outline.

## Design

Applies to `src/pages/wikipedia-report-2026/[slug].astro` and `full.astro` (both use `ReportOutline`).

1. **Sidebar from `md` (768px).**
   - The grid changes from `lg:` to `md:`.
   - Narrower rail at md (about 14rem). The current widths stay at lg/xl.
   - The rail stays sticky under the navbar and scrolls on its own.
2. **Collapsible groups.**
   - Each outline group with children gets a toggle button (a chevron with `aria-expanded` and `aria-controls`). Groups are depth-2 headings with depth-3 children on section pages, and each entry's headings on the full page.
   - The group being read opens automatically, as today.
   - A group the reader opened by hand stays open until they close it.
   - Keyboard: buttons are focusable and Enter/Space toggle them.
3. **Hide button.**
   - A button in the rail header ("Hide contents", with a ◀ icon) collapses the rail. The article then uses the full width.
   - A small sticky "Contents" tab at the left edge brings the rail back.
   - The choice is remembered in `localStorage` (`t4p-report-sidebar-hidden`; wrap reads and writes in try/catch, and default to shown).
   - Hiding only applies at md+.
4. **Phones (<768px).**
   - The current `<details>` box above the article is replaced by a slim sticky bar under the navbar: "☰ Contents" plus the current section title, which the existing highlighter updates.
   - The bar opens a slide-in drawer from the left, built with native `<dialog>` and `showModal()`. That gives focus trapping, Esc to close and a backdrop. It also closes on a backdrop click and when a link inside it is tapped.
   - Focus returns to the button on close.
   - The drawer holds the same outline (compact variant).
5. **Without JS.**
   - At md+ the rail shows fully expanded, with no toggles needed.
   - On phones the existing `<details>` disclosure stays as the fallback. JS swaps it for the bar and drawer.
6. **Constraints.**
   - CSP: no `style=""`, no inline handlers, only bundled scripts and scoped or global CSS.
     - One exception, approved in review: a tiny `<script is:inline>` at the top of the layout element in `ReportShell.astro` reads `t4p-report-sidebar-hidden` and sets `data-sidebar-hidden` before first paint. Bundled module scripts are deferred, so without it a reader who hid the rail sees it render and then collapse, which is noticeable on the long full-text page. The CSP middleware adds a nonce to every `<script>` (precedent: `CspStylePatch.astro`, `HomeLayout.astro`). It does nothing else, and the bundled script stays the source of truth.
   - Respect `prefers-reduced-motion` for the drawer and rail animations.
   - Print hides all of this, as today (`report-no-print`).
   - Keep the highlighter's content-visibility-safe behaviour (`outlineCurrent.ts`).
   - Put pure logic (group open/close state given active group and manual toggles) in a DOM-free helper with Vitest tests.

## Left to the builder

Exact widths, icons, animation timing, and the visual design of the toggle and hide tab. These should stay consistent with DESIGN.md and the existing outline styles.
