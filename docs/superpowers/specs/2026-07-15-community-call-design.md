# Community Call Page Design

**Date:** 2026-07-15  
**Status:** Draft — awaiting approval  
**Scope:** `/community-call` (new design) + `/community-call-old` (old design), homepage banner on both homepages, new Notion database

---

## Goal

A permanent, shareable URL — `techforpalestine.org/community-call` — that answers "when is the next community call and where do I watch it" for a stranger who arrived from a link pasted into X or Slack.

The stream links change every month and are maintained by a human in Notion. The page must never require a code change to stay current.

---

## Context that shaped the design

- **The reader is a stranger.** The page's stated job is to be shared cold on social. It cannot assume the reader knows what a T4P community call is.
- **Two separate YouTube broadcasts** run per call — one widescreen, one vertical. These are genuinely different video IDs, not one stream on two devices.
- **Dates move each month** (scheduled around availability, no fixed cadence).
- **Nobody creates next month's row the day after a call.** The database will lag the permanent link by days or weeks, every month.

---

## Decisions

| Decision             | Choice                                                                                                      | Why                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| URL structure        | `/community-call` = new design (indexed, shareable); `/community-call-old` = old design (noindex, excluded) | The shared link must be the new design. Inverts the repo's `-new` convention: here the _old_ page is the throwaway.               |
| Notion schema        | One row per call                                                                                            | Schema is expensive to change later. Gives date-derived state, staging, and a free archive.                                       |
| Live detection       | Date + assumed 2h window, computed client-side                                                              | No human toggle; client-side so the 300s cache can't render a stale "LIVE NOW".                                                   |
| YouTube presentation | One primary "Watch on YouTube" (widescreen) + "Prefer vertical? →" text link                                | Desktop/mobile are _format_ preferences, not device constraints. Every phone plays widescreen fine; vertical is worse for slides. |
| Banner               | Slim bar, 7-day window, non-dismissible                                                                     | The visibility gate already solves banner-blindness; dismissal solves it a second time at much higher cost.                       |
| Calendar             | Per-call Google Calendar link (`<a>`, no `.ics` route)                                                      | Dates move, so a recurring `RRULE` hold would drift and lie.                                                                      |

---

## Notion database

**Name:** Community Calls  
**Env var:** `NOTION_COMMUNITY_CALLS_DB_ID`

| Property               | Type      | Notes                                                                                                  |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `Title`                | title     | e.g. "July 2026 Community Call"                                                                        |
| `Date`                 | date      | **Must include a time.** Date-only rows are rejected (see Timezones).                                  |
| `Description`          | rich_text | The month's topic. Drives the OG description — without it every month's Slack preview looks identical. |
| `YouTube URL`          | url       | Widescreen stream. Primary.                                                                            |
| `YouTube Vertical URL` | url       | Vertical stream. Secondary.                                                                            |
| `LinkedIn URL`         | url       | Often filled in late — page must tolerate absence.                                                     |
| `X URL`                | url       | Profile link, not a stream link.                                                                       |
| `Visibility`           | checkbox  | Matches every other Notion DB in this repo. Lets next month's row be staged.                           |

Adding a month = adding a row. Never overwrite. Past rows become the archive (deferred, see below).

---

## Data layer

### `fetchCommunityCalls(locals)` — `src/store/notionClient.ts`

Follows the shape of the existing `fetchNotionEvents`. Differences that matter:

1. **Read the full `.date` object, not `.date.start`.** When a time zone is set, Notion returns `start` with **no UTC offset** (`"2026-07-22T17:00:00.000"`) and carries the zone separately in `time_zone`. `new Date()` parses that as the _visitor's_ local time, so London and Tokyo compute different absolute instants — fatal for a live window. Resolve `time_zone` to a UTC instant server-side.
2. **Reject date-only rows.** `"2026-07-22"` parses to UTC midnight, putting the live window at 00:00–01:30 UTC. Treat as unschedulable and fall through to the no-call state.
3. **`sanitizeUrl()` all four URL fields** (from `src/components/projects/projectData.js`) — the repo's documented XSS boundary guard, per `docs/API.md` and `src/pages/api/projects.ts`.
4. **Errors go through `reportError()`** (`src/lib/report-error.ts`) with `ctx?.waitUntil(Sentry.flush(2000))`, per `docs/API.md` conventions. Do **not** copy `home-new.astro:37`'s bare `catch {}` — that line violates the documented convention.

Filter `Visibility = true`, sort by date descending.

### `src/utils/communityCall.ts`

```
featuredCall(calls, now) -> call | null
callState(call, now)     -> "upcoming" | "live" | "ended"
```

`featuredCall` picks the one call the page is about, in strict priority order:

1. a call currently live (`date <= now < date+2h`), else
2. the soonest upcoming call, else
3. the most recent ended call, **if it ended within the last 7 days**, else
4. `null` → the none-scheduled state

Step 3 is what stops a month-old call sitting on the page claiming to be news, and step 4 is what stops the page going blank the moment a call ends. Without the priority order these overlap: right after a call ends with no next row created, both "ended" and "none scheduled" are simultaneously true.

Pure, no Notion types, no network. Exists because two pages and the banner all need it — not for testability (no test framework is configured).

---

## Page states

Four, not three. **No-call-scheduled is the default state** — with dates moving month to month, the page spends most of its life here.

Derived from `featuredCall` above; conditions are evaluated in that priority order, not independently.

| State              | Condition                           | Content                                                                 |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------- |
| **None scheduled** | `featuredCall` is `null`            | "Next call not scheduled yet" + email signup as primary CTA             |
| **Upcoming**       | `now < date`                        | Local date/time, add-to-calendar, stream buttons, pitch                 |
| **Live**           | `date <= now < date+2h`             | Pulsing indicator, buttons promoted to top                              |
| **Ended**          | `now >= date+2h`, ended <7 days ago | Links relabelled as recordings; copy must not assert a recording exists |

2h, not 90min: a call that runs long must not flip to "watch the recording" while people are still on it.

State is computed **client-side** from an ISO instant in a `data-` attribute.

### Content ratio

Majority pitch, minority links. What it is, who it's for, whether it's participatory, how long it runs, whether it's recorded, whether registration is needed. A links-only page works for insiders; this page's audience is strangers by construction.

### Link handling

- Missing URL → button/link **absent**, not `href=""` (which navigates to the current page and looks silently broken). Applies per-field, independently — e.g. if only `YouTube Vertical URL` is empty, the primary "Watch on YouTube" button still renders normally and just the secondary "Prefer vertical? →" line is omitted. Filling it in later needs no code change, just the Notion row.
- When a date exists but the primary YouTube link doesn't: "Stream links go live closer to the call."
- X is a single tertiary line carrying the "available as soon as it starts" note. It is not a CTA.

### Time display

Visitor-local time only, no UTC. `Wed 17:00 UTC` is Thursday 04:00 in Sydney — a UTC-only bar shows the wrong day for the entire Asia-Pacific region.

No ticking countdown. Relative time inside 24h ("Starts in 3 hours"), "Starting soon" inside ~15 min, absolute date beyond that.

### Metadata

Per-call title and description passed into `HomeLayout`'s existing `title`/`description`/`image` props. **OG tags drive share previews, not JSON-LD** — this is the ship-today requirement and it is free. `Event` JSON-LD only buys Google rich results and is deferred.

---

## Banner

`src/components/CommunityCallBanner.astro` — one component, shared markup.

- **Styling:** `tailwind.config.mjs` tokens only (`bg-page`, `ink`). Avoid `design-system.css` vars — HomeLayout-only.
- **Window:** visible only for `upcoming` calls within 7 days, or `live`. Hidden for every other state — **including `none-scheduled` and `ended`**. The banner exists to flag something time-sensitive and actionable; unlike the page itself, it has no business saying "nothing's scheduled" or "here's a past recording" — it just doesn't render.
- **Non-dismissible.** The 7-day gate already prevents blindness.
- **CTA tracks proximity:** `Add to calendar` (7d out) → `Join →` (inside 24h) → `We're live` (during). A `Join →` seven days early cries wolf.
- **Time:** visitor-local.
- **Rendering:** server-rendered with `AbortSignal.timeout(1200)`, fail-open to no bar. A client-rendered top bar shifts the homepage layout.

### Insertion points are not symmetric

- `home-new.astro` — inside the slot, above `<HomeNavbar />`. ~2 lines.
- `index.astro` — inside the slot, **below** the nav. `Layout.astro:151` renders `<Navigation />` above `<slot />`, so a page-level component physically cannot sit above the nav there. Going above it means editing `Layout.astro`, which 37 pages import — 1–2h and a large blast radius, for a cosmetic difference nobody is comparing side by side.

---

## Plumbing

| Change                                                       | File                                                                                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Add `noindex?: boolean` prop                                 | `src/layouts/Layout.astro` (mirroring `HomeLayout.astro:89`) — it has no such prop today, so `-old` cannot otherwise be noindexed |
| Exclude `/community-call-old/`                               | `astro.config.mjs` sitemap filter                                                                                                 |
| `/community-calls` + `/community-calls/` → `/community-call` | `public/_redirects` (both slash variants, per the `/resources` precedent at `:2-3`)                                               |
| `Cache-Control: public, max-age=300`                         | set on the page; `cache-control.ts:9` respects a pre-set header                                                                   |

### Env var registration

`NOTION_COMMUNITY_CALLS_DB_ID` must be added to **all** of:

- `.env` — **not `.dev.vars`**. No Notion DB ID lives in `.dev.vars`; `wrangler.toml:8-9` says local dev uses `.env`.
- `.env.example`
- `DEPLOYMENT.md:14-18`
- `docs/NOTION.md` — table row **and** the literal "7 separate Notion databases" → 8
- `docs/ARCHITECTURE.md:28` — "7 databases total" → 8
- `docs/ENVIRONMENT.md` — audit table row

Not needed: `wrangler.toml` (dashboard-only by convention), `src/env.d.ts` (runtime env is `Record<string, string>`).

---

## Manual steps (cannot be done in code)

1. **Connect the Notion integration to the new database** (Connections → add integration). Without this the API returns 404 while the database looks fine in the UI.
2. **Add `NOTION_COMMUNITY_CALLS_DB_ID` to the Cloudflare Pages dashboard.** Skip this and it works locally and 500s in production.

---

## Known issues accepted

**Sitemap/canonical trailing-slash mismatch.** `@astrojs/sitemap` emits `/community-call/` (Astro's `build.format` defaults to `"directory"`; the `build:` block in `astro.config.mjs:29` is Vite's, not Astro's), while `HomeLayout.astro:37-44` strips the trailing slash for the canonical. This page is the first HomeLayout page ever admitted to the sitemap, so the conflict has never fired in production.

The clean fix is top-level `trailingSlash: "never"`, but that changes routing for all 37 pages — a blast radius far larger than the defect, and not a same-day change. The canonical tag still resolves the ambiguity for Google; this is an inconsistent signal, not an error. **Deferred to a follow-up with proper testing.**

---

## Deferred

| Item                     | Why not today                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Past-calls archive       | Zero past calls exist on day one — it renders an empty div. Schema accumulates rows regardless. Add when it has something to show. |
| `Event` JSON-LD          | Buys Google rich results, not share previews. OG tags cover the ship-today need.                                                   |
| `.ics` route             | Retired permanently — dates move, so no recurring hold. Google Calendar `<a>` covers it.                                           |
| Ticking countdown        | Needs `setInterval`, formatting, pluralization. Static relative time carries the same information.                                 |
| Banner dismissal         | The 7-day gate already solves the problem it addresses. Revisit if anyone complains.                                               |
| `/events` cross-link     | 1 line, low value until the archive exists.                                                                                        |
| `trailingSlash: "never"` | See Known issues.                                                                                                                  |

---

## Out of scope (flagged, not fixed)

`set:html={JSON.stringify(schema)}` appears at 15 sites including `events-new.astro:58`, which already feeds Notion-controlled text into a script tag. `JSON.stringify` escapes neither `<` nor `/`, so a Notion title containing `</script>` breaks out; CSP blocks execution of the result. Pre-existing and repo-wide — this work inherits the pattern rather than introducing it, and should not try to fix it here.

Separately: a root-level `_headers` exists alongside `public/_headers` with different content. Only the latter ships. The root one appears dead, and `public/_headers` references `src/middleware.ts` — a file `SECURITY.md` M-6 says must never exist.

---

## Estimate

~3–4h. (The pre-review design was ~8–10h; the delta was almost entirely things that render empty, duplicate an existing safeguard, or don't do what they were claimed to do.)
