---
title: "The \"-new\" Duplicate-Page Pattern"
summary: "A repo-wide convention where a redesigned page ships as a sibling route with a -new suffix, kept out of the sitemap until it either replaces the original or is deleted."
topics: [architecture, routing, conventions]
sources:
  - id: astro-config
    type: file
    path: astro.config.mjs
  - id: redirects
    type: file
    path: public/_redirects
  - id: claude-md
    type: file
    path: CLAUDE.md
  - id: incubator-old
    type: file
    path: src/pages/_incubator.old
  - id: project-details-temp
    type: file
    path: src/pages/project-details-temp.astro
  - id: community-call
    type: file
    path: src/pages/community-call.astro
  - id: community-call-old
    type: file
    path: src/pages/community-call-old.astro
---

The T4P website carries two versions of most major pages side by side: a legacy route (`about.astro`, `events.astro`, `donate.astro`) and one or more redesigned siblings named with a `-new` suffix (`about-new.astro`, `events-new.astro`, `donate-new.astro`). Both routes are live and served in production at the same time; the `-new` page is not a draft sitting in a branch, it is a real, deployed URL that simply isn't linked from navigation and is kept out of Google's index [@claude-md]. This is the repo's mechanism for building and reviewing a full redesign of a page in place, without a staging environment or feature-flagged routing layer.

## The pairing convention

`-new` pages import the newer [design system](design-system) and its component set (for example `src/components/home/*`), while the original pages keep the older Tailwind styling. `donate.astro` even has a three-way split — `donate.astro`, `donate-2.astro`, and `donate-new.astro` — showing that a page can accumulate more than one redesign attempt before one wins. Nothing at the routing level ties a page to its `-new` counterpart; the relationship is purely a file-naming convention that both engineers and the sitemap filter are expected to honor.

## Sitemap exclusion is the enforcement mechanism

Because `-new` pages are real, crawlable routes, the risk is that search engines index two near-duplicate URLs for the same content. The project's answer is a `filter` callback passed to the `@astrojs/sitemap` integration in `astro.config.mjs`: it holds an explicit array of path suffixes — `/about-new/`, `/team-new/`, `/donate-new/`, `/home-new/`, `/events-new/`, and about twenty others — and drops any sitemap entry whose URL ends with one of them [@astro-config]. This list is hand-maintained; adding a new `-new` page without adding its suffix here means it silently starts showing up in search results as a duplicate of its canonical counterpart. `CLAUDE.md` codifies this as a rule for any new experimental or orphan page, not just `-new` variants [@claude-md].

Sitemap exclusion only controls indexing — it does not redirect or block traffic. Of the paired routes, only `/index-new` has an actual 301 rule in `public/_redirects`, sending it to `/` [@redirects]. Every other `-new` page has no redirect and stays reachable indefinitely at its own URL, hidden from the sitemap but otherwise a normal page a visitor (or a bot that ignores `robots`/sitemap signals) can load directly.

## Orphans that break the naming convention

Not every leftover page fits the clean `page.astro` / `page-new.astro` pair, and the exceptions show what happens when the convention is only partially followed.

`src/pages/_incubator.old` carries a `.old` extension rather than `.astro`, so Astro's file-based router never turns it into a route at all — it is dead source code, not a hidden page [@incubator-old]. It is a leftover of the incubator redesign that was never deleted, distinct from a `-new` page in that it isn't reachable by any URL.

`src/pages/project-details-temp.astro`, by contrast, is a real, live `.astro` file that imports `Layout.astro` and renders a hardcoded, single-project page [@project-details-temp]. It is excluded from the sitemap (`/project-details-temp/` appears in the exclude array [@astro-config]) but not linked from anywhere in the site, and it has no `-new`-style sibling — it is a standalone orphan that the sitemap filter is the only thing keeping out of search results.

## The inverted case: `/community-call`

`community-call.astro` and `community-call-old.astro` deliberately invert the usual naming convention. Here the plain, unsuffixed name is the new design and the canonical, indexed URL, while `-old` is the throwaway: `community-call-old.astro` is excluded from the sitemap (`/community-call-old/` is in the exclude array [@astro-config]) and explicitly marked `noindex={true}` in its own `Layout` props, with a comment stating it exists "only so the old homepage's banner doesn't jar visitors into an unrelated visual style" [@community-call-old]. `community-call.astro` carries no such flag and is the page meant to be shared and indexed [@community-call]. This exists so that visitors arriving from the legacy homepage's banner see a page that matches the surrounding legacy visual style, while everyone else — anyone following a shared link — lands on the redesigned, canonical page. See [client-side A/B testing](client-side-ab-testing) for how the *other* redesigned pages, like the homepage, decide which version a given visitor sees.
