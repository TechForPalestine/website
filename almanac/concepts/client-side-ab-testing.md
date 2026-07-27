---
title: "Client-Side A/B Testing"
summary: "The repo's technique for splitting traffic between a legacy page and its -new redesign using a synchronous localStorage-reading script instead of middleware, cookies, or a consent banner."
topics: [architecture, routing, analytics]
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
  - id: not-found
    type: file
    path: src/pages/404.astro
  - id: membership-page
    type: file
    path: src/components/MembershipPage.tsx
---

Client-side A/B testing is how the site decides, per visitor, which of two competing page designs to show, without ever involving the server. A synchronous inline `<script>` in the page `<head>` reads an assignment key from `localStorage`, generates one with `Math.random()` if it's missing, and — for the losing variant — calls `location.replace()` to a sibling route before the browser paints anything. The technique was chosen specifically for the homepage test comparing `/` (control) against [`/home-new`](the-new-page-pattern) (variant), and it is the concrete mechanism behind the repo's [`-new` duplicate-page pattern](the-new-page-pattern) whenever a redesign needs a live traffic split rather than an all-or-nothing cutover.

## Why localStorage instead of cookies or middleware

The approved design doc records the choice explicitly: `localStorage` is not a cookie, so assigning a variant this way doesn't trigger UK PECR's consent-banner requirement, and it needs no new infrastructure — no Cloudflare Worker, no middleware entry, no server-side routing change [@ab-design-spec]. The alternative of doing the split in `src/middleware/index.ts` was considered and rejected for exactly that reason: it would add a stateful, server-side decision to a request pipeline that otherwise only handles caching and CSP.

The trade-off is that the split isn't invisible. Because assignment happens in the browser, control-page markup is always sent first — the redirect to the variant is a second navigation, which is why the anti-flicker script has to run synchronously in `<head>`, before first paint, rather than after the page has already rendered.

## How the assignment script actually works

In `src/pages/index.astro`, an `is:inline` script placed in `Layout.astro`'s `slot="head"` runs immediately:

```js
var v = localStorage.getItem("ab-homepage-variant");
if (!v) {
  v = Math.random() < 0.5 ? "original-homepage" : "new-homepage";
  localStorage.setItem("ab-homepage-variant", v);
}
if (v === "new-homepage") {
  location.replace("/home-new");
}
```

`location.replace` (not `location.href`) is used so the control page never lands in browser history — a `variant` user who hits back doesn't bounce into a broken intermediate state [@index-astro]. Once the key is set, it is sticky: a repeat visitor gets the same variant on every subsequent load until they clear storage, and a JS-disabled visitor always sees control, since nothing runs to redirect them [@ab-design-spec].

The live code also does something the original design and implementation-plan documents don't mention: it skips the whole redirect for crawlers. `index.astro` checks the request's `user-agent` against a bot pattern (`bot|crawl|spider|...|GPTBot|ChatGPT|CCBot|...`) and short-circuits the script with `if (isBot) return;` before anything else runs [@index-astro]. The comment explains the reasoning — if a crawler were randomly redirected to `/home-new` on some crawls and not others, Google's indexing signal for the site's most important URL would become non-deterministic. Bots always see the stable, indexable control content.

One more divergence from the paper design is worth flagging for anyone reading the spec and plan docs literally: both describe the localStorage values and the Plausible `variant` prop as `"control"`/`"variant"` (spec) or `"control"`/`"new"` (plan) [@ab-design-spec] [@ab-plan]. The shipped code in `index.astro` and `home-new.astro` instead uses `"original-homepage"`/`"new-homepage"` throughout [@index-astro] [@home-new-astro]. The mechanism the docs describe is otherwise accurate; only the literal string values differ from what was written down beforehand — a reminder that the docs record intent at design time, and the code is the current source of truth for the exact values in play.

## Tracking exposure

Both pages fire a Plausible custom event once the queue is available, guarded by a `sessionStorage` flag so a single page view doesn't double-count:

```js
const v = localStorage.getItem("ab-homepage-variant");
if (v === "original-homepage" && !sessionStorage.getItem("ab-homepage-tracked")) {
  sessionStorage.setItem("ab-homepage-tracked", "1");
  window.plausible("ab-homepage", { props: { variant: "original-homepage" } });
}
```

`home-new.astro` runs the mirror image, checking for `"new-homepage"` [@home-new-astro]. Because the event only fires when the stored variant matches the page actually being viewed, a visitor who navigates to `/home-new` directly (bypassing the assignment script entirely) doesn't pollute the `new-homepage` numbers, and neither does someone who cleared storage mid-session [@ab-plan].

The variant key isn't confined to the homepage pair, either: `src/pages/404.astro` reads the same `ab-homepage-variant` value to decide whether its own navigation links should point at the legacy routes (`/projects`, `/events`, `/get-involved`) or their `-new` counterparts, so a visitor who has already been assigned the new homepage design doesn't get bounced back into the old site from a 404 page [@not-found].

## The same pattern elsewhere in the repo

The homepage test isn't the only sticky-assignment A/B split in the codebase. `MembershipPage.tsx` runs a nearly identical pattern under a different key, `membership_ab_variant`, deciding whether a visitor sees a fee calculator or not:

```js
const stored = localStorage.getItem("membership_ab_variant");
if (stored === "Calculator") return true;
if (stored === "No Calculator") return false;
const assigned = Math.random() < 0.5;
localStorage.setItem("membership_ab_variant", assigned ? "Calculator" : "No Calculator");
```

It also supports a URL query-param override (`?ab=yes`/`?ab=no`) checked before falling back to storage [@membership-page]. This confirms the homepage design doc's claim that the localStorage-and-`Math.random()` approach was "consistent with existing A/B test patterns in the codebase" [@ab-design-spec] — the same shape (read key, assign if missing, persist, branch on it) recurs independently in a React island rather than an Astro page script.

## Ending a test

The design doc lays out an explicit shutdown procedure, since a client-side test has no built-in expiry: remove the anti-flicker script from `index.astro`, then either replace `index.astro`'s content with the winning `home-new.astro` and add a redirect from `/home-new` to `/` (if the variant won), or delete `home-new.astro` and redirect it away (if control won) [@ab-design-spec]. As of the current code, neither branch of that shutdown has happened — `index.astro` and `home-new.astro` still exist as fully separate pages with the assignment script live, meaning the test is still running.
