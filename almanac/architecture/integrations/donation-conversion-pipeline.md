---
title: "The Donation and Membership Conversion Pipeline"
summary: "Donation and membership completions fan out to EmailOctopus and the Hub API, while a separate Plausible proxy tracks conversion goals and falls back to a Cloudflare KV store when Plausible silently drops an event, so the admin dashboard can merge both counts."
topics: [architecture, integrations, donations, analytics]
sources:
  - id: donation-complete
    type: file
    path: src/pages/api/donation-complete.ts
  - id: membership-complete
    type: file
    path: src/pages/api/membership-complete.ts
  - id: pipe-route
    type: file
    path: src/pages/api/pipe.ts
  - id: conversion-stats
    type: file
    path: src/pages/api/admin/conversion-stats.ts
  - id: conversions-page
    type: file
    path: src/pages/admin/conversions.astro
  - id: basic-auth
    type: file
    path: src/utils/basicAuth.ts
  - id: wrangler-toml
    type: file
    path: wrangler.toml
  - id: donations-doc
    type: file
    path: docs/DONATIONS.md
  - id: origin-util
    type: file
    path: src/utils/origin.ts
---

A donation or membership payment on the site produces two independent, uncoordinated trails of data: side effects triggered by a client-side success callback, and an analytics conversion event fired separately through Plausible. Neither trail talks to the other while it runs — they are only brought back together afterward, on the admin conversion dashboard, by a route that reads both sources and merges them by date.

## Completion callbacks: EmailOctopus and the Hub

`src/pages/api/donation-complete.ts` and `src/pages/api/membership-complete.ts` are POST endpoints the QGIV donation widget's client-side success callback calls once a payment finishes [@donation-complete] [@donations-doc]. Both validate the request `Origin` against the production domain plus any `*.website-aun.pages.dev` preview deploy before touching the body, validate the email with a regex, and truncate first/last name fields to 200 characters [@donation-complete] [@membership-complete].

`donation-complete` does one thing past validation: if `EO_API_KEY` is configured, it subscribes the contact to an EmailOctopus list tagged `"donor"` [@donation-complete]. `membership-complete` does two things, run concurrently with `Promise.allSettled` so a failure in one doesn't block the other: it subscribes the same way but tagged `"member"`, and it calls the internal Hub API (`POST {HUB_API_URL}/api/auth/invite` with `{ email, type: "paid" }`, authorized by `HUB_API_KEY`) to invite the new member as a paid Hub user [@membership-complete]. `Promise.allSettled` here means neither the EmailOctopus tag nor the Hub invite can fail the other or fail the client-visible response — both routes return `{ success: true }` even if their downstream call errors, logging the failure through `reportError` instead of surfacing it to the browser [@donation-complete] [@membership-complete]. Neither route reads from or writes to the Cloudflare KV store described below; the KV fallback only exists on the separate analytics path.

## The Plausible proxy and its KV fallback

Conversion tracking is a second, unrelated request: the client fires a Plausible goal event (`Monthly-donate`, `One-time-donate`, or `Membership-complete`) through `POST /api/pipe`, which proxies it to `https://plausible.io/api/event` rather than the browser calling Plausible directly [@pipe-route]. Routing analytics through a same-origin endpoint means a browser extension or ad-blocker that specifically blocks third-party requests to `plausible.io` doesn't block the traffic, since from the browser's perspective the request never leaves the site's own origin. `pipe.ts` uses a looser origin policy than the completion callbacks — production plus *any* `*.pages.dev` suffix, since it only proxies analytics and carries no side effect worth restricting further [@pipe-route] [@origin-util].

Even routed through the same origin, Plausible can still silently drop an event server-side (bot filtering, for example) — the upstream response carries an `x-plausible-dropped: 1` header when that happens [@pipe-route]. `pipe.ts` checks that header, and if the event was dropped *and* its name is one of the three tracked conversion goals, it writes a fallback record into a Cloudflare KV namespace bound as `DROPPED_CONVERSIONS` in `wrangler.toml` [@pipe-route] [@wrangler-toml]. The key is `dropped:<date>:<time>:<random>`, and the stored value is deliberately minimal: event name, timestamp, a few non-PII props (`source`, `amount`, `membership_variant` when present), and boolean flags recording only *whether* an IP and user-agent were available on the original request — never the IP or user-agent values themselves [@pipe-route] [@donations-doc]. The KV write happens inside `ctx.waitUntil`, so it doesn't add latency to the response the browser is waiting on and can still complete after the response has already been sent.

## Merging both sources for the admin dashboard

`/api/admin/conversion-stats` is a `GET` route gated by HTTP Basic Auth: `isAuthorized`/`unauthorizedResponse` in `src/utils/basicAuth.ts` decode the `Authorization` header and compare the username and password against `ADMIN_USERNAME`/`ADMIN_PASSWORD` using a constant-time comparison, rather than a plain `===`, so the check can't leak timing information about how much of the credential matched [@basic-auth]. `src/pages/admin/conversions.astro` runs the identical `isAuthorized` check server-side before it even renders the page shell, so an unauthenticated request never receives the dashboard's HTML — the client-only React dashboard component is a second layer behind a page that's already gated [@conversions-page].

For a given date range, `conversion-stats.ts` runs three queries in parallel: live goal counts from the Plausible Stats API v2 (broken down further by `source` for the two donation goals, and by `membership_variant` for membership), a scan of every `dropped:*` KV key in that range with its own per-goal/per-source/per-day aggregation, and a second Plausible query for conversion detail breakdowns (amount, variant) [@conversion-stats]. It returns the Plausible numbers and the KV-derived numbers as separate arrays alongside a combined `details` array, rather than pre-summing them server-side — `src/components/ConversionDashboard.tsx` is what actually adds the two sources together per goal and per day when it renders the chart and summary cards. The dashboard exists specifically so ad-blocker-driven undercounting on the direct Plausible path doesn't make donation conversions look lower than they really are: the KV fallback recovers exactly the events that would otherwise have vanished.

This pipeline is one instance of the repository's [API route conventions](api-route-conventions) — `prerender = false`, `getEnv` for secrets, Origin checks before body parsing, generic client-facing errors, and `reportError` plus `Sentry.flush` on failure all appear identically across `donation-complete.ts`, `membership-complete.ts`, `pipe.ts`, and `conversion-stats.ts`. The Origin allowlist and Basic Auth choices here are part of the broader [security hardening baseline](security-hardening-baseline); the full set of environment variables this pipeline depends on (`EO_API_KEY`, `HUB_API_URL`, `HUB_API_KEY`, `PLAUSIBLE_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`) is catalogued in the [environment variables reference](environment-variables).
