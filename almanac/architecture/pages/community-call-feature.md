---
title: "The Community Call Feature"
summary: "/community-call is a permanent, Notion-driven page that tells a stranger arriving from a shared link when the next Tech for Palestine call is and where to watch it, computing its own live/upcoming/ended state in the browser so a five-minute edge cache can never show a stale LIVE banner."
topics: [architecture, notion, homepage]
sources:
  - id: community-call-astro
    type: file
    path: src/pages/community-call.astro
  - id: community-call-old-astro
    type: file
    path: src/pages/community-call-old.astro
  - id: banner
    type: file
    path: src/components/CommunityCallBanner.astro
  - id: community-call-util
    type: file
    path: src/utils/communityCall.ts
  - id: format-call-time
    type: file
    path: src/utils/formatCallTime.ts
  - id: design-spec
    type: file
    path: docs/superpowers/specs/2026-07-15-community-call-design.md
  - id: notion-client
    type: file
    path: src/store/notionClient.ts
---

`/community-call` is built to be pasted cold into Slack or X and still make sense: a permanent URL that answers "when is the next community call and where do I watch it" without the reader knowing what a T4P community call even is [@design-spec]. The data behind it — a call's title, date, stream links, and visibility — lives in a single Notion database, `Community Calls`, read through `NOTION_COMMUNITY_CALLS_DB_ID`, so a human can update next month's call by editing a row rather than shipping code [@design-spec]. The design doc that specifies this feature is dated 2026-07-15 and still carries the header `Status: Draft — awaiting approval` [@design-spec], but the code tells a different story: `src/pages/community-call.astro`, `src/pages/community-call-old.astro`, `src/components/CommunityCallBanner.astro`, `src/utils/communityCall.ts`, and `src/utils/formatCallTime.ts` all exist in the repository and implement the design end to end, including details the spec calls out explicitly (the 2-hour live window, the 7-day banner gate, per-call Google Calendar links, `sanitizeUrl` on every stored link) [@community-call-astro][@banner][@community-call-util][@format-call-time]. The "Draft" header is stale relative to what has actually shipped; this page describes the feature as built, verified against the source files rather than the spec's status line.

## Picking the one call the page is "about"

A Notion database accumulates rows over time, but the page only ever has one call to show. `featuredCall(calls, now)` in `src/utils/communityCall.ts` resolves this in a strict priority order: a call currently live, else the soonest upcoming call, else the most recently ended call if it ended within the last 7 days, else `null` [@community-call-util]. The ordering matters because, right after a call ends and nobody has created next month's row yet, "ended" and "nothing scheduled" would otherwise both be true at the same time — the priority list is what keeps the page from flickering between those two framings. `callState(call, now)` classifies a single call as `"upcoming"`, `"live"`, or `"ended"` using a fixed `LIVE_WINDOW_MS` of two hours: a call that runs long stays "live" rather than flipping to "watch the recording" out from under people still on the call [@community-call-util].

Both functions are pure and take no Notion types, because three different places need the same answer — `community-call.astro`, `community-call-old.astro`, and `CommunityCallBanner.astro` all call `fetchCommunityCalls` and then run the result through `featuredCall`/`callState` independently [@community-call-astro][@community-call-old-astro][@banner].

## Server render, then a client-side correction

Each of the three consumers fetches calls from `fetchCommunityCalls(Astro.locals)` in `src/store/notionClient.ts` at request time, computes an `initialState` server-side, and sets `Cache-Control: public, max-age=300` on the response [@community-call-astro][@notion-client]. A five-minute cache means the server-computed state can go stale — a call can flip from upcoming to live, or live to ended, while a cached copy of the page is still being served. Every page carries a matching inline `<script>` that reruns the same `computeState` logic against `new Date()` in the visitor's browser and overwrites the `data-state` attribute the CSS keys off, so the state the visitor actually sees is always current no matter how old the cached HTML is [@community-call-astro]. The same script also replaces the server-rendered date/time text: Cloudflare's edge runtime renders in UTC, not the visitor's zone, so the initial "Today"/"Tomorrow" framing can be wrong for the reader and gets swapped for one computed with `formatLongCallTime(startIso, new Date())` in `src/utils/formatCallTime.ts` [@community-call-astro][@format-call-time]. `formatCallTime.ts` exports a short form for the banner ("Today at 7:30 PM", "Wed 7:30 PM") and a long form for the page itself, both taking `now` as an explicit parameter rather than reading it internally, specifically so the identical function produces a correct answer whether it runs on the server or in the browser [@format-call-time].

## Four page states, majority pitch over links

The page renders one of four states depending on `featuredCall`'s result: no call scheduled (an email signup as the primary call to action), upcoming (local date/time, a "Watch on YouTube" button, an optional vertical-stream link, calendar link), live (the same links promoted, plus a pulsing "We're live now" indicator), or ended (links relabeled as recordings, with copy that doesn't assert a recording actually exists) [@community-call-astro]. Any of the four link fields — primary YouTube, vertical YouTube, LinkedIn, X — that comes back empty from Notion is simply omitted rather than rendered as an empty `href`, so filling one in later needs no code change [@community-call-astro][@notion-client].

## The banner: a second, stricter consumer of the same state

`CommunityCallBanner.astro` is shared markup mounted on both homepages — above `HomeNavbar` on `home-new.astro`, below the legacy `<Navigation />` on `index.astro`, since `Layout.astro` renders navigation before its content slot and the banner can't get above it there without a much larger change — and it renders nothing at all unless the featured call is live or upcoming within a 7-day window [@banner]. It is deliberately non-dismissible: the 7-day visibility gate already keeps the banner from showing up for weeks at a time, so a dismiss button would just solve the same banner-blindness problem a second time at extra cost [@design-spec]. Its call-to-action text tracks proximity to the call — "Add to calendar" more than a day out, "Join →" inside 24 hours or once the call goes live — computed both server-side for the initial render and corrected client-side the same way the page itself is [@banner]. The banner fetches with a 1.2-second timeout race against `fetchCommunityCalls` and fails open to rendering nothing if that races out, so a slow Notion response never blocks the homepage shell [@banner].

## The inverted route pair

`community-call.astro` is the canonical, indexed page; `community-call-old.astro` is the noindexed counterpart that exists only so a visitor arriving from the legacy homepage's green-themed banner doesn't land on a jarringly different visual style [@community-call-old-astro]. This is the opposite of the repository's usual `-new` convention, where the suffixed page is the unlaunched one — the reasoning behind inverting it here, and the Notion schema and live-detection choices that make the permanent link safe to share, are recorded on [the community-call URL inversion decision](../../decisions/community-call-url-inversion). The Notion-side mechanics this page depends on — the axios client, `Visibility` filtering, and the UTC-resolution logic in `fetchCommunityCalls` — are covered on [the Notion client layer](../integrations/notion-client), and the paired/`-new` routing convention this feature deliberately breaks is covered on [the "-new" duplicate-page pattern](../../concepts/the-new-page-pattern).
