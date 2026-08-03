---
title: "The home-new.astro Page Composition"
summary: "home-new.astro assembles eleven components from src/components/home/ through HomeLayout.astro into the redesigned, noindexed homepage that the A/B test can route visitors to."
topics: [architecture, homepage, frontend]
sources:
  - id: home-new-astro
    type: file
    path: src/pages/home-new.astro
  - id: home-layout
    type: file
    path: src/layouts/HomeLayout.astro
  - id: hero-section
    type: file
    path: src/components/home/HeroSection.astro
  - id: manifesto-section
    type: file
    path: src/components/home/ManifestoSection.astro
  - id: portfolio-section
    type: file
    path: src/components/home/PortfolioSection.astro
  - id: support-section
    type: file
    path: src/components/home/SupportSection.astro
  - id: why-section
    type: file
    path: src/components/home/WhySection.astro
  - id: testimonials-section
    type: file
    path: src/components/home/TestimonialsSection.astro
  - id: openings-section
    type: file
    path: src/components/home/OpeningsSection.astro
  - id: cta-section
    type: file
    path: src/components/home/CtaSection.astro
  - id: home-navbar
    type: file
    path: src/components/home/HomeNavbar.astro
  - id: astro-config
    type: file
    path: astro.config.mjs
---

`src/pages/home-new.astro` is the redesigned homepage: a single Astro page that composes eleven section components from `src/components/home/` inside `HomeLayout.astro`, rather than the older `Layout.astro`/`Navigation.astro` shell that `index.astro` uses [@home-new-astro][@home-layout]. It is a fully live, server-rendered route — not a mockup or a branch — but it carries `noindex={true}` and is excluded from the sitemap by path suffix in `astro.config.mjs` [@home-new-astro][@astro-config], because for now it is reached almost exclusively through the client-side redirect described in [client-side A/B testing](../../concepts/client-side-ab-testing) rather than through search or site navigation. The page is the concrete implementation of the [Steadfast Press design system](../../concepts/design-system): every section below is built from `.ts-*` typography classes and the `page`/`sand`/`butter`/`ink` token palette that `HomeLayout.astro` and the design tokens define, none of the older Tailwind defaults that `index.astro` still uses.

## Server-side data before the first component renders

Before any markup runs, the page's frontmatter fetches open roles from `https://hub.techforpalestine.org/api/public/open-roles`, capped with `AbortSignal.timeout(1200)` and wrapped in a bare `try`/`catch` that swallows failures — a deliberately tight budget because the code comment notes this call has averaged 0.7–0.8s in production, and the section it feeds is below the fold and renders fine with zero roles [@home-new-astro]. If the fetch returns roles, the page builds a schema.org `ItemList` JSON-LD block listing each opening by title and description and injects it into the `<head>` slot [@home-new-astro]. The same `openRoles` array then decides, later in the template, whether `OpeningsSection` renders at all.

## Section order and what each section does

The page renders its sections in a fixed sequence, wrapped by a `<CommunityCallBanner />` placed above `HomeNavbar` — the insertion point that only `HomeLayout`-based pages can use, since `Layout.astro` renders `<Navigation />` above its slot and forces the banner below the nav on legacy pages instead; see [the community-call feature](community-call-feature) for how the banner itself decides whether to show anything [@home-new-astro]:

1. **`HeroSection`** — a full-bleed rounded hero image with a `ken-burns` pan animation, an overlaid CTA card with two buttons ("See what we've built" scrolling to the portfolio anchor, and a primary "Get involved"/"Become a member" button gated on `membershipLive`), and a separate stacked layout for viewports under 810px [@hero-section].
2. **`ManifestoSection`** — an editorial headline plus a stats row (`stats-grid`) whose numbers count up from zero via `requestAnimationFrame` once scrolled into view, sitting above a four-photo collage pulled up over the stats block with negative margin [@manifesto-section].
3. **`PortfolioSection`** — the page's most distinctive visual device: a `portfolio-stack` of hardcoded project cards (UpScrolled, Boycat, Find a Protest, Thaura.ai, Newscord, Apricot) that become `position: sticky` at staggered `top` offsets above 810px, then scale down via a scroll listener as later cards stack over them, producing a layered-deck effect as the visitor scrolls [@portfolio-section].
4. **`SupportSection`** — four numbered "how we help" pillars (Mentorship, Community, Operations, Funding), each entering with an `IntersectionObserver`-driven fade/translate, below a full-width photo of a T4P conference [@support-section].
5. **`WhySection`** — a two-column block pairing an embedded `youtube-nocookie.com` video with a founder pull-quote from Paul Biggar, both animating in on scroll [@why-section].
6. **`TestimonialsSection`** — an infinite CSS-animation marquee built from the same testimonial array tripled (`[...testimonials, ...testimonials, ...testimonials]`) so the loop has no visible seam, pausing on hover and collapsing to a static wrapped grid under `prefers-reduced-motion` or `html.no-js` [@testimonials-section].
7. **`OpeningsSection`** *(conditional)* — renders only `{openRoles.length > 0 && <OpeningsSection ... />}`, showing up to four roles from the server-fetched list with per-role "Apply" links that route to `/membership-new`, `/get-involved-new`, or `/volunteer-new` depending on role type and `membershipLive` [@home-new-astro][@openings-section].
8. **`PressSection`** — a row of press-outlet logos and article cards linking out to coverage (Guardian, TechCrunch, Al Jazeera, and others) [@home-new-astro].
9. **`CtaSection`** — the page's one dark panel, using `bg-ink-dark` per the design system's Single Dark Surface Rule, combining a membership/get-involved CTA with a nested "Donate to keep it running" block offering fixed donation amounts (`$25`/`$50`/`$100`/`Custom`) that link to `/donate-new` [@cta-section].
10. A final `<section>` wrapping **`SignUpFormHomeNew`**, the page's email capture form, laid directly in the page rather than as a component under `src/components/home/` [@home-new-astro].

`HomeLayout.astro` closes the page with an eleventh, implicit section: `FooterSection`, mounted once inside the layout itself rather than by `home-new.astro`, carrying its own independent `-new`-only navigation described on [Routing and Navigation](../routing-and-navigation) [@home-layout].

## Preloading and the A/B tracking script

The page preloads its two heaviest above-the-fold images — the hero background and the first manifesto collage photo — with `<link rel="preload" as="image">` tags in the `head` slot, the hero one marked `fetchpriority="high"` [@home-new-astro]. At the bottom of `<main>`, an inline script checks `localStorage.getItem("ab-homepage-variant")` and, if it reads `"new-homepage"` and the session hasn't already recorded the event, fires a Plausible `ab-homepage` custom event with `{ variant: "new-homepage" }` [@home-new-astro]. This is the variant side of the mechanism explained in full on [client-side A/B testing](../../concepts/client-side-ab-testing) and recorded as a decision on [the homepage A/B test strategy](../../decisions/homepage-ab-test-strategy).

## What depends on this page staying stable

Because `home-new.astro` is one of the two arms of a live traffic split, its content and behavior are being measured against `index.astro` in Plausible under the same `ab-homepage` goal. Changing section order, removing the tracking script, or changing the `membershipLive` gating would change what's being compared mid-test. The page's noindex/sitemap-exclusion status is also load-bearing: nothing about the route itself prevents a direct visit or a crawl by a bot that ignores those signals, so the redirect script in `index.astro` explicitly special-cases known crawler user agents to avoid sending them here at random.
