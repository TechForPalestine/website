# /incubator Redesign: Design Spec

**Date:** 2026-09-24
**Register:** brand (PRODUCT.md)
**System:** DESIGN.md, "The Organizing Table", with `/membership` and `/supporting-member` as the live references.

## Problem

`src/pages/incubator.astro` predates the design system and breaks most of it:

- Six sections, each a different gradient tint (`from-green-50`, `from-blue-50`, `from-amber-50`, `from-red-50`, `from-gray-50`, `from-yellow-50`, `from-purple-50`). DESIGN.md: one green accent, no gradients, no blue.
- Every section is the same shape: a tinted rounded box of icon-circle cards. The "What the incubator does" grid is eight identical icon + heading + text cards (No Identical Grid Rule).
- Three competing CTAs in blue, green and purple, plus a closing `bg-gradient-to-r from-blue-500` pill with `shadow-xl` and `hover:scale-105`.
- Centered hero with a "Welcome to the..." headline that says nothing about what the visitor gets.
- No imagery, no project evidence, no founder voices. PRODUCT.md principle 2: "Show the work, not the cause."
- No `description` meta; 1,022 lines, most of it repeated inline SVG.

## Who lands here

A tech worker or organizer with a project idea (or an early project) for Palestine, deciding whether to apply. They want to know, fast: is my project a fit, what do I actually get, what will you ask of me, and how long until I hear back. A second group wants to help but not lead; they need a clear exit to `/ideas` or `/volunteer`.

## Page structure (alternating Paper / First Light bands, one Nightfall block)

| # | Surface | Section | Content |
|---|---|---|---|
| 1 | Paper | Hero | Left-aligned H1 + lede + one primary CTA + "10 to 30 minutes to apply, decision within 10 days" note. Right: real event photo (`/images/membership/member-panel.webp`). |
| 2 | First Light band | Who it's for | Overline, H2, one sentence, focus areas as a wrapped row of static chips (not icon cards). |
| 3 | Paper | What you get | Asymmetric two columns. Left: H2 + the two "new builders / experienced teams" paragraphs. Right: a ruled definition list of the eight offerings (term / description), no icons. |
| 4 | First Light band | The deal | Overline, H2, two side-by-side white panels: "We ask" (4 expectations) and "We don't ask" (3 non-requirements). |
| 5 | Paper | How applying works | Left: H2, timeline fact, secondary apply link. Right: ordered list of 5 steps on a vertical rail, each led by a Grove Green time label (10 to 30 minutes, After you apply, A 30-minute call, Within 10 days, If admitted) instead of a numeral. |
| 6 | First Light band | Project leader voices | Project leader testimonials via the shared `TestimonialCard`; `kind: "founder"` entries, shown as Project Leader, approved subset only. |
| 7 | Paper | Other ways in | "Not ready to apply?" ruled list linking to `/ideas` and `/volunteer`, plus "Already applied? We'll be in touch." |
| 8 | Nightfall | Terminal CTA | One headline, one inverse pill: "Apply to the incubator". |

## Content rules

- All facts (200+ projects, 3000+ volunteers, 60+ project leaders, Office Hours 6x/week with Paul Biggar, 10-day decision, 30-minute interview, twice-weekly decisions, 10 to 30 minute form) are kept exactly as they are on the live page. No new numbers are invented.
- Copy is tightened, never softened. No em dashes. No "Welcome to".
- Content lives in `src/data/incubator.ts` (the `src/data/membershipBenefits.ts` pattern), so the page file holds structure only.

## Visual rules (from DESIGN.md)

- Colors: `text-ink`, `text-ink-secondary`, `border-ink-divider`, Grove Green `#157A3E` (hover `#0e5a2f`, matching `/supporting-member`), Grove Green Deep `#2F5C3F` for overlines, First Light `#E7F2E9` / Edge `#D2E4D6`, Stone `#F2F3EE`, Nightfall `#101010`.
- Type: H1 `text-[38px] min-[810px]:text-[54px] font-extrabold leading-[1.02]`; H2 `text-[28px] min-[810px]:text-[38px] font-extrabold leading-tight`; body `text-[19px] min-[810px]:text-[21px] leading-relaxed`; overline `text-xs font-bold uppercase tracking-[0.14em] text-[#2F5C3F]`, bands only.
- Container `mx-auto max-w-[1280px] px-6 sm:px-8`, matching `/supporting-member`.
- Elevation: `shadow-sm` or nothing. No `shadow-md/lg/xl`, no `hover:scale`.
- Banned on this page: gradients, blue/purple/amber/red/yellow utilities, colored card stripes (`border-t-[3px]`, `border-l-*`), icon circles above headings, `ts-*`, `font-serif`, inline `style=""`, em dashes, `target="_blank"` on internal links.

## Behavior

- Apply links keep the existing destination `/project-application-form` but open in the same tab (primary conversion, internal URL).
- Apply clicks fire a Plausible custom event `Incubator Apply Click` with `cta_location` = `hero` | `process` | `terminal`, using the same guarded pattern as `/supporting-member`.
- No client-side islands. Page stays plain Astro.
- Motion: none beyond color transitions on links and buttons.

## Out of scope

- `/project-application-form`, `/ideas`, `/volunteer` themselves.
- `incubator-new.astro` and `_incubator.old` (dead code per CLAUDE.md; not touched).
- Adding a test framework.

## Open questions for the content owner

1. Hani & Said (Thaura) are held back on `/supporting-member` as "not yet approved for this page". This spec excludes them from `/incubator` too until approved. Only Issam Hijazi (UpScrolled) and Nima Akram (Newscord) are shown as project leaders.
2. The live page says "200+ projects" in one place and "60+ project leaders" in another; PRODUCT.md says "80+ supported projects" and `/supporting-member` says "90+ Projects". This redesign carries the incubator page's existing numbers verbatim; reconciling them is a content decision.
