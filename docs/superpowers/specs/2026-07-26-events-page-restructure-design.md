# Events Page Restructure — Design Spec

Date: 2026-07-26
Page: `src/pages/events-new.astro` / `src/components/events/EventsNew.tsx` (the live "-new" redesign track — `events.astro` is the legacy page and is out of scope)

## Background

Paul (boss) flagged confusion on the current `/events-new` page:

1. The two "featured" cards per category look like upcoming events but are frequently past events (the code falls back to most-recent-past when a category has fewer than 2 upcoming events — `EventsNew.tsx:513-528`), styled identically to real upcoming ones.
2. Users have to scan through every category section to find what's actually coming up — there's no single place that shows "what can I go to next."
3. Recorded past events have no visible signal that a recording exists — users have to open each event's modal to find out.
4. In-person events in particular offer no clear action when they're not upcoming (no register CTA, and today's featured-card styling doesn't distinguish "come learn more" from "here's a recording").

Paul's proposal (confirmed via Kate/Mar/Ty conversation) is to stop mixing upcoming and past events within each category, and instead separate the page into a single upcoming-events zone and an archive.

## Goals

- Make "what's coming up, in order" instantly scannable without reading every category.
- Never present a past event with the same visual weight/badge as an upcoming one.
- Surface recordings where they exist, without implying anything's missing where they don't.
- Give every upcoming event a real, obvious call to action.

## Non-goals

- No calendar widget (month/week grid) — considered and explicitly deferred; a chronological list satisfies "see how far out something is" via an explicit date block, at much lower build cost.
- No changes to the legacy `/events` page.
- No changes to the ICS data source, `fetchEvents()`, or the `EventItem` type — `recordingLink` already exists (`eventsClient.ts:18`, sourced from ICS `X-RECORDING-URL`) and is sufficient for this design.
- No change to the popup/modal (`EventModal`) contents — it already surfaces all links correctly (`primaryEventLink()`, `eventsClient.ts:348-360`).

## Design

### 1. Page structure

Replace the current layout — five stacked category sections, each internally split into "2 featured cards + list of the rest" — with two top-level zones on `EventsNew.tsx`:

**Upcoming Events** (new, top of page body, above all category sections):
- A single chronological list merging events from all 5 categories (In-Person, Occupied Tech Podcast, Community Calls, Roundtable, Book Club), sorted soonest-first.
- No cap on count — every upcoming event shows, in date order.
- Each card carries a category tag so category identity isn't lost, but category is no longer the primary grouping.

**Past Events** (existing category sections, retained, rendered below Upcoming):
- Same 5 `SECTION_DEFS` sections and headings as today (`eventSections.ts:22-54`).
- Each section becomes a pure archive: only past events, compact rows only (no featured-card treatment), existing collapse/expand toggle and 5-at-a-time "Show more" pagination unchanged.
- Because every event here is past by construction, the "Upcoming" pill logic in `PastEventRow` (`EventsNew.tsx:442-447`) is removed entirely — it can never fire in this zone and its removal simplifies the row.

Section-membership logic (which category an event belongs to) is unchanged; only the upcoming/past split point moves from "per-category" to "whole-page."

### 2. Upcoming event card

Each card in the merged list:
- **Date block** (left-aligned): day-of-week abbreviation, day number, month — e.g. "Thu 14 Aug" — so "how far out" is scannable without parsing prose. This is the calendar-order clarity Kate asked for, without building an actual calendar.
- **Category tag**: small pill (In-Person / Podcast / Community Call / Roundtable / Book Club).
- **Title** + a short one-line time/location string (unchanged sourcing from existing event fields).
- **One primary CTA button**, chosen via existing `primaryEventLink()` priority for upcoming events (`registerLink` → `watchLink`), falling back to "Add to calendar" (Google Calendar link, already built for the modal footer, `EventsNew.tsx` modal footer) when neither exists. Every card gets exactly one clear action — this directly fixes the "in-person events have no useful action" complaint.
- Visual treatment: the current bold "Upcoming" card style (`border-2 border-positive bg-positive-tint`, `EventsNew.tsx:346-352`) applies to every card in this zone unconditionally — no per-card pill needed since the whole zone is upcoming by construction.

### 3. Past event row + recording badge

Each row in a category archive:
- Date, title (existing `PastEventRow` fields) — category tag is omitted here since it's redundant under a category heading.
- **Recording badge**: a small "▶ Watch recording" tag/link shown only when `event.recordingLink` is present. No badge, no "unavailable" label, when it's absent — keeps older events visually quiet since Paul is only adding video going forward.
- Clicking a row still opens the existing `EventModal` unchanged (gated on `hasMeaningfulDescription`, `eventsClient.ts:342-346`) for full description and all links. The badge is a fast-path signal, not a replacement for the modal.

### 4. Empty state

If there are zero upcoming events across all categories (`upcoming.length === 0` at the whole-page level — per-category empty states are no longer a concept since there's no per-category upcoming zone), the Upcoming Events zone renders a short message instead of an empty list:

> "No upcoming events right now — check back soon, or browse recordings below."

with an anchor link that scrolls to the Past Events zone.

### 5. Data/component impact summary

- `eventSections.ts`: add a page-level split — compute one merged, sorted `upcoming` array across all sections, and keep `groupIntoSections()` (or a variant of it) returning past-only events per section. No changes to `EventItem`/`fetchEvents`.
- `EventsNew.tsx`: replace the per-section `FEATURED_COUNT` fallback logic (`513-528`) with (a) one new "Upcoming Events" block rendered above the section loop, and (b) simplified `PastEventRow`/section rendering with the "Upcoming" pill branch removed.
- No changes to `EventModal`, `eventsClient.ts`, or the legacy `/events` page.

## Open questions for implementation

None — all sections above were reviewed and approved during design. Standard build risk (verifying visual spacing/responsiveness) belongs to implementation, not this spec.
