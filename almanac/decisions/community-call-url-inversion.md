---
title: "Community Call URL Inversion"
summary: "/community-call, not /community-call-old, is the canonical indexed URL for the recurring call page, deliberately inverting the repo's usual -new convention because the permanent shareable link can never be a suffix that might later be cleaned up."
topics: [decisions, community-call, routing, notion]
sources:
  - id: spec
    type: file
    path: docs/superpowers/specs/2026-07-15-community-call-design.md
  - id: page-new
    type: file
    path: src/pages/community-call.astro
  - id: page-old
    type: file
    path: src/pages/community-call-old.astro
  - id: astro-config
    type: file
    path: astro.config.mjs
  - id: redirects
    type: file
    path: public/_redirects
  - id: banner
    type: file
    path: src/components/CommunityCallBanner.astro
---

`techforpalestine.org/community-call` is the redesigned page, and it is also the one that gets indexed, linked from redirects, and pasted into Slack or X. `/community-call-old` carries the legacy visual style and is marked `noindex` and excluded from the sitemap. Everywhere else in this repo the `-new` suffix marks the throwaway candidate page and the unsuffixed route is canonical until a cutover; here that pattern is deliberately reversed, because the reader of `/community-call` is a stranger clicking a link pasted somewhere months ago, and that link has to keep working no matter which visual design is live [@spec].

## Context

The design brief that produced this page states the requirement plainly: a permanent, shareable URL that answers "when is the next community call and where do I watch it" for someone who has never heard of Tech for Palestine [@spec]. [The `-new` page pattern](the-new-page-pattern) exists so a redesigned page can be excluded from the sitemap, iterated on, and eventually promoted to the canonical route once it's ready — the old page is disposable once the swap happens. That works because nobody has a permanent bookmark to `/about-new`.

A community-call link is different. Once it is pasted into a tweet or a pinned Slack message, it is out of the team's control. If the new design had shipped at `/community-call-new` following the usual convention, a later cleanup pass — deleting the old page and promoting the new one, exactly as the pattern intends — would silently break every copy of that link already in circulation. The spec calls this out directly: the decision "inverts the repo's `-new` convention: here the _old_ page is the throwaway" [@spec].

## Decision

`/community-call` ships as the new, indexed design from day one; `/community-call-old` exists only to give the legacy homepage's banner a visually consistent landing page and is marked `noindex` in code and excluded from the sitemap `filter` [@spec]. This is confirmed in the shipped files, not just the design doc: `community-call.astro` passes no `noindex` prop to `Layout`, while `community-call-old.astro` explicitly sets `noindex={true}` [@page-new] [@page-old], and `astro.config.mjs`'s sitemap `filter` array excludes `/community-call-old/` [@astro-config]. `public/_redirects` sends both `/community-calls` and `/community-calls/` to `/community-call` [@redirects].

Three related choices back the same goal of a link that stays accurate without a code deploy:

- **Notion schema is one row per call**, not a single row that gets overwritten each month. The spec treats this as expensive to change later and worth getting right up front — it gives date-derived page state (upcoming/live/ended) for free, lets a future month's row be staged ahead of time behind the `Visibility` checkbox, and accumulates a free archive of past calls as a side effect [@spec].
- **Live detection is computed client-side** from the call's date plus an assumed two-hour window, with no human toggle to mark a call "live." The spec's reasoning is that the page carries a `Cache-Control: public, max-age=300` header, and a server-computed state could serve a stale "LIVE NOW" to a visitor for up to five minutes after the call actually ended; recomputing the state in the browser at request time avoids that [@spec] [@page-new].
- **The calendar link is a per-call Google Calendar URL**, not a recurring `.ics`/`RRULE` subscription. Community call dates move every month with no fixed cadence, so a recurring calendar hold would drift out of sync with reality and actively mislead anyone who subscribed to it. A fresh link generated from each row's actual date can't drift [@spec].

The banner (`CommunityCallBanner.astro`, shared between the old and new homepages) is a slim, non-dismissible bar rather than a closeable notice. The spec's reasoning: the banner only renders inside a seven-day window before a call or while one is live, so the visibility gate already prevents banner-blindness; adding a dismiss control would solve the same problem a second time at the cost of extra state and UI [@spec] [@banner]. The banner also links each homepage to its matching page variant — `theme="old"` on the legacy homepage points at `/community-call-old`, keeping visual continuity for that audience — rather than sending every visitor to the canonical `/community-call` [@banner].

## Status

The spec document's own header still reads "Status: Draft — awaiting approval" [@spec]. That status is stale relative to the code: `community-call.astro`, `community-call-old.astro`, and `CommunityCallBanner.astro` all exist in the repository, implement the URL split, the `noindex` flag, the client-side live-window logic, and the non-dismissible banner exactly as the spec describes, and the sitemap filter and redirects are wired up to match [@page-new] [@page-old] [@astro-config] [@redirects]. The design has shipped; the header was never updated after approval. Treat the code as the current source of truth over the doc's status line — see [the community call feature page](../architecture/pages/community-call-feature) for how the shipped mechanics work end to end.

## Consequences

Any future redesign of this page must preserve the inversion: a maintainer cannot "clean up" by deleting `/community-call-old` and moving a `-new` file into its place, because the canonical slug already has no `-new` suffix to promote. If the page is ever redesigned again, the safe pattern is to build the new version at a throwaway path, test it, and then overwrite the content behind the existing `/community-call` route — not to repeat the usual [`-new` page pattern](the-new-page-pattern) naming.

The one-row-per-call schema means the Notion database will accumulate rows indefinitely with no automatic pruning; the spec explicitly defers building a past-calls archive UI until there is enough data to make one worth showing [@spec]. Because live/upcoming/ended state depends on wall-clock time and a client-side recomputation rather than a human flag, there is no way to force a call into "live" state early for a rehearsal — the state is whatever the date and the fixed two-hour window say it is.
