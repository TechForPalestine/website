---
title: "Routing and Navigation"
summary: "src/pages/ holds parallel legacy and -new route trees served by two fully decoupled navigation systems, kept apart by the sitemap filter and a client-side A/B script."
topics: [architecture]
sources:
  - id: pages-dir
    type: file
    path: src/pages/
  - id: navigation-astro
    type: file
    path: src/components/Navigation.astro
  - id: navbar-svelte
    type: file
    path: src/components/NavBar.svelte
  - id: home-navbar
    type: file
    path: src/components/home/HomeNavbar.astro
  - id: footer-section
    type: file
    path: src/components/home/FooterSection.astro
  - id: navigation-ts
    type: file
    path: src/components/navigation.ts
  - id: page-404
    type: file
    path: src/pages/404.astro
  - id: layout-astro
    type: file
    path: src/layouts/Layout.astro
  - id: home-layout
    type: file
    path: src/layouts/HomeLayout.astro
  - id: astro-config
    type: file
    path: astro.config.mjs
  - id: incubator-old
    type: file
    path: src/pages/_incubator.old
---

`src/pages/` is a file-based route tree that mostly exists in duplicate: for roughly two dozen sections of the site — about, incubator, team, faq, contact, projects, ideas, tools, membership, volunteer, donate, events, and more — there is both a legacy route (`about.astro`) and a redesigned `-new` route (`about-new.astro`) [@pages-dir]. The two trees are not just visually different; they run on separate layouts and separate navigation components that never link to each other's routes. What holds the split together at the routing layer is the sitemap `filter` in `astro.config.mjs`, which excludes every `-new` path from search indexing [@astro-config], and a small set of named exceptions where the pattern breaks down. The conceptual model behind the pairing — why it exists and how the exceptions fit it — is covered on [the -new page pattern](../concepts/the-new-page-pattern); this page maps the concrete route surface and the two navigation systems that sit on top of it.

## Two navigations that never meet

Legacy pages render through `src/layouts/Layout.astro`, which mounts `<Navigation />` in the page body [@layout-astro]. `Navigation.astro` builds a `Map<string, { href, submenu }>` of nav sections — Home, About, Incubator, Get Involved, Events, Updates — with every internal `href` pointing at a legacy route (`/about`, `/incubator`, `/donate`, `/events`) [@navigation-astro], then hands that map as a prop to `NavBar.svelte`, mounted with `client:load` so it hydrates immediately on page load [@navigation-astro][@navbar-svelte].

`-new` pages render through a different layout, `src/layouts/HomeLayout.astro`, and a different navigation component, `src/components/home/HomeNavbar.astro`, which does not import or extend `Navigation.astro` in any way — it defines its own `navItems` array from scratch, and every internal `href` in it points at a `-new` route (`/about-new`, `/incubator-new`, `/donate-new`, `/events-new`) [@home-layout][@home-navbar]. `home-new.astro`, the redesigned homepage that composes both of these, is described on the [home-new composition](pages/home-new-composition) architecture page. The footer tells the same story from the other end: `FooterSection.astro`, used only by `HomeLayout.astro`, defines its own separate nav-item lists and also links exclusively to `-new` routes (`/privacy-policy-new`, `/terms-new`, `/legal-new`, `/media-new`, and so on) [@footer-section]. A visitor on any `-new` page cannot reach a legacy page through site chrome, and a visitor on any legacy page cannot reach a `-new` page through site chrome — the two navigations are fully decoupled by design, not by omission.

A third navigation data structure, `src/components/navigation.ts`, defines yet another `Map` of labeled routes, but nothing under `src/` imports it [@navigation-ts]. It is dead code: neither `Navigation.astro` nor `HomeNavbar.astro` reads from it, and it should not be treated as a source of truth for what the site actually links to.

## The one page both worlds share

`src/pages/404.astro` is the single route that does not sort cleanly into either tree. It renders through `HomeLayout.astro` and `HomeNavbar.astro` — the `-new` layout and navbar — but its own body content defaults to legacy destinations (`/`, `/projects`, `/events`, `/get-involved`) [@page-404]. A small inline script then checks `localStorage.getItem("ab-homepage-variant")`, and if it reads `"new-homepage"`, rewrites the Projects, Events, and Get Involved links in place to their `-new` equivalents [@page-404]. This is the one spot in the routing layer where the two navigation worlds are deliberately bridged, using the same client-side variant flag that drives the homepage A/B test rather than any server-side routing logic.

## Orphans and the inverted pair

Not every route has a `-new` sibling. `src/pages/` also contains standalone pages with no counterpart at all: `coming-soon`, `learn-more`, `project`, `ramadan`, `success`, `guides/vercel-to-netlify`, `vercel`, `admin/conversions`, `icj`, `project-details-temp`, `e4p/sign-up`, `event-details`, and `404` itself [@pages-dir]. `src/pages/_incubator.old` sits in the same directory but is not a route at all — Astro only builds files with a page-file extension, so this `.old` file is inert, kept as a retired draft rather than a live path [@incubator-old].

One pair inverts the naming convention the rest of the site follows: `community-call.astro` is the current, canonical, indexed page, while `community-call-old.astro` is the one excluded from the sitemap [@astro-config]. Everywhere else `-new` means "unlaunched redesign" and the un-suffixed name means "live"; here the un-suffixed name is the newer page. The reasoning behind that inversion is recorded on the [community-call URL inversion](../decisions/community-call-url-inversion) decision page, and the feature itself is covered on the [community-call feature](pages/community-call-feature) architecture page.

## How the split is enforced, not just conventional

Nothing in Astro's routing stops a `-new` page from being crawled or linked accidentally — the separation is enforced entirely by the `filter` callback passed to `sitemap()` in `astro.config.mjs`, which excludes every `-new` path (and the other orphans above) from `sitemap-index.xml` by matching path suffixes [@astro-config]. Exact route-by-route data lives on the [route inventory](../reference/route-inventory) reference page, and the exact exclude list and redirect rules live on the [sitemap and redirects](../reference/sitemap-and-redirects) reference page; both build on the route surface and navigation split described here. See [Rendering Model, Build, and Deployment](rendering-and-deployment) for how this sitemap filter fits into the wider build.
