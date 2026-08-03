---
title: "Homepage A/B Test Strategy"
summary: "The redesigned homepage is compared against the current one with a client-side, localStorage-based anti-flicker redirect rather than middleware or cookies, chosen for PECR compliance and zero infrastructure change; the documented shutdown procedure has not yet run, so both pages still exist."
topics: [decision, homepage, analytics]
sources:
  - id: ab-design-spec
    type: file
    path: docs/superpowers/specs/2026-06-30-homepage-ab-test-design.md
  - id: ab-plan
    type: file
    path: docs/superpowers/plans/2026-06-30-homepage-ab-test.md
  - id: index-astro
    type: file
    path: src/pages/index.astro
  - id: home-new-astro
    type: file
    path: src/pages/home-new.astro
---

## Status

Approved and live. `docs/superpowers/specs/2026-06-30-homepage-ab-test-design.md` carries the header `Status: Approved` [@ab-design-spec], and the mechanism it describes is running in production: both `src/pages/index.astro` and `src/pages/home-new.astro` currently carry the assignment and tracking scripts the design calls for [@index-astro][@home-new-astro].

## Context

The team wanted to compare the redesigned homepage, [`home-new.astro`](../architecture/pages/home-new-composition), against the existing one before committing to a wider rollout of the same visual redesign across the rest of the site, and deliberately scoped the first test to a single page — the homepage — "to keep variables isolated before rolling out to other sections" [@ab-design-spec]. Three implementation options were available: a cookie-based split decided in `src/middleware/index.ts`, a server-side routing rule, or a purely client-side script. The design doc rules out the first two explicitly: a cookie carrying an A/B assignment falls under UK PECR's consent-banner requirement, which the site does not otherwise need to show, and either server-side option would mean adding new infrastructure — a Cloudflare Worker, a new middleware stage, or routing logic — to what is otherwise a two-stage `cache-control`/`csp` pipeline [@ab-design-spec].

## Decision

The site assigns each visitor a homepage variant using a synchronous, inline `<script>` placed in `index.astro`'s `<head>` via `Layout.astro`'s `slot="head"` mechanism, run before the browser paints anything. The script reads a `localStorage` key; if unset, it flips a `Math.random() < 0.5` coin, persists the result, and — for the losing (redesigned) variant — calls `location.replace('/home-new')` rather than `location.href`, so the control page never lands in browser history [@ab-design-spec][@index-astro]. Both `index.astro` and `home-new.astro` fire a Plausible custom event, `ab-homepage`, carrying the assigned variant as a property, once the Plausible queue is available later in the page [@ab-design-spec][@index-astro][@home-new-astro].

The specific string values shipped in code diverge from what both planning documents describe. The design spec's flow diagram and assignment table use `"control"`/`"variant"` [@ab-design-spec], and the implementation plan's global constraints section separately specifies `"control"`/`"variant"` for the localStorage value but `"control"`/`"new"` for the Plausible event property [@ab-plan] — three different naming schemes across two documents for the same two states. The code that actually shipped uses neither: `index.astro` and `home-new.astro` both store and check `"original-homepage"` or `"new-homepage"` as the single localStorage value, and pass that same string through to Plausible as the `variant` property [@index-astro][@home-new-astro]. The overall mechanism — sticky assignment, anti-flicker redirect, dual Plausible tracking — was implemented faithfully; only the literal string constants differ from every version written down beforehand. This is covered in more mechanical detail on [client-side A/B testing](../concepts/client-side-ab-testing).

The live code also adds one behavior neither document mentions: it checks the request's `user-agent` against a bot-detection pattern and returns immediately without running any assignment or redirect logic for matched crawlers, so that a search bot always sees the stable `index.astro` content instead of being randomly routed to a noindexed page on some crawls and not others [@index-astro].

## Consequences

Sticky assignment via `localStorage` means a given browser keeps seeing the same variant across sessions until its storage is cleared, and a visitor with JavaScript disabled always sees the control page, since nothing runs to redirect them [@ab-design-spec]. Because assignment happens client-side, `index.astro`'s markup is always sent to the browser first even for variant visitors — the redirect to `/home-new` is a second navigation, not a server-side routing decision, which is the direct cost of avoiding a cookie and a middleware change. `home-new.astro` stays `noindex` and excluded from the sitemap for the duration of the test, since it is not a canonical page while the comparison is running [@ab-design-spec].

The design doc defines an explicit shutdown procedure for when the test concludes: remove the anti-flicker script from `index.astro`; if the redesign wins, replace `index.astro`'s content with `home-new.astro`'s and add a redirect from `/home-new` to `/`; if the original wins, delete `home-new.astro` and redirect `/home-new` away [@ab-design-spec]. As of the current codebase, neither branch of that procedure has run — `index.astro` and `home-new.astro` both still exist as fully separate, live pages, and the assignment script is still active in `index.astro` [@index-astro][@home-new-astro]. Ending the test, in either direction, is a deferred, pending consequence of this decision rather than a completed one: the repository's current state is mid-test, not post-test.
