---
title: Coverage Map
summary: Frozen page inventory for this first wiki build.
topics: [build, wiki, reference]
sources: []
---

# Coverage Map

This is the frozen page inventory for the first CodeAlmanac build of the T4P
website repository (Astro v5 SSR on Cloudflare Pages, React/Svelte islands,
Notion + ProjectHub integrations). Phase 2 must write every page listed here
unless this file is updated with an exact repo-evidence reason a page was
dropped.

## Page Inventory

### almanac/getting-started.md

- slug: getting-started
- purpose: Front-door routing page — orients a new agent to the stack (Astro
  SSR/Cloudflare), the `-new` duplicate-page convention, the security rules
  that gate PRs, and where to go for common tasks.
- planned links: concepts/the-new-page-pattern, architecture/rendering-and-deployment,
  architecture/request-middleware, decisions/security-hardening-baseline,
  guides/ship-a-change
- evidence: CLAUDE.md, AGENTS.md, README.md
- note: written last, after all other pages exist, per build instructions.

### concepts/

1. `concepts/the-new-page-pattern.md`
   - slug: the-new-page-pattern
   - purpose: Defines the paired `page.astro` / `page-new.astro` redesign
     convention, how sitemap exclusion enforces it, and the orphan/exception
     cases (`_incubator.old`, `project-details-temp.astro`, the inverted
     `community-call` naming).
   - links: decisions/homepage-ab-test-strategy, decisions/community-call-url-inversion,
     architecture/routing-and-navigation, reference/sitemap-and-redirects,
     concepts/client-side-ab-testing
   - evidence: astro.config.mjs (sitemap filter), public/_redirects, CLAUDE.md,
     src/pages/_incubator.old, src/pages/project-details-temp.astro,
     src/pages/community-call.astro, src/pages/community-call-old.astro

2. `concepts/client-side-ab-testing.md`
   - slug: client-side-ab-testing
   - purpose: The localStorage + anti-flicker-script technique used to A/B
     test redesigned pages without middleware, cookies, or a consent banner;
     explains why this technique was chosen (PECR, no infra changes) and
     where it is used.
   - links: concepts/the-new-page-pattern, decisions/homepage-ab-test-strategy,
     architecture/pages/home-new-composition
   - evidence: docs/superpowers/specs/2026-06-30-homepage-ab-test-design.md,
     docs/superpowers/plans/2026-06-30-homepage-ab-test.md, src/pages/index.astro,
     src/pages/home-new.astro

3. `concepts/design-system.md`
   - slug: design-system
   - purpose: Explains the "Steadfast Press" token system and brand rules
     (One Accent Rule, Single Dark Surface Rule, Fraunces/Outfit split, etc.)
     as the mental model behind the `-new` visual redesign, and how it
     relates to the T4P brand brief.
   - links: architecture/pages/home-new-composition, reference/design-token-values,
     concepts/the-new-page-pattern
   - evidence: DESIGN.md, tailwind.config.mjs, PRODUCT.md

4. `concepts/notion-as-data-source.md`
   - slug: notion-as-data-source
   - purpose: Explains Notion as the site's headless CMS: the two integration
     patterns (shared axios client vs. official SDK for one-off writes), the
     `Visibility` checkbox / `showAll` convention, and the property-name
     coupling gotcha (renaming a Notion column silently breaks a field).
   - links: architecture/integrations/notion-client, reference/notion-databases,
     guides/debug-notion-data-not-showing
   - evidence: src/store/notionClient.ts, docs/NOTION.md,
     src/pages/api/e4p-signatories.ts, src/pages/api/endorsement-request.ts

5. `concepts/environment-variable-resolution.md`
   - slug: environment-variable-resolution
   - purpose: Explains the three-tier `getEnv()` fallback mental model
     (Cloudflare runtime env → `import.meta.env` → `process.env`) and why
     reading `process.env` directly is unsafe on the Cloudflare Pages
     runtime; distinguishes `.dev.vars` vs `.env` vs the dashboard.
   - links: reference/environment-variables, guides/add-an-environment-variable,
     architecture/rendering-and-deployment
   - evidence: src/utils/getEnv.ts, docs/ENVIRONMENT.md, CLAUDE.md

### architecture/

6. `architecture/rendering-and-deployment.md`
   - slug: rendering-and-deployment
   - purpose: System-level page on the Astro `output:"server"` + Cloudflare
     adapter setup, integrations wired in `astro.config.mjs`, build/deploy
     flow to Cloudflare Pages, and CI gates.
   - links: architecture/request-middleware, concepts/environment-variable-resolution,
     guides/ship-a-change, decisions/empty-content-collections
   - evidence: astro.config.mjs, wrangler.toml, DEPLOYMENT.md,
     docs/ARCHITECTURE.md, .github/workflows/ci.yml

7. `architecture/request-middleware.md`
   - slug: request-middleware
   - purpose: Explains the single `sequence(cacheControl, csp)` middleware
     pipeline: what each stage does, why order matters, and how the CSP
     nonce is injected via `HTMLRewriter` (and why CSP is a no-op in `pnpm dev`).
   - links: decisions/middleware-order-and-single-entrypoint, architecture/rendering-and-deployment,
     guides/verify-csp-changes-locally, decisions/security-hardening-baseline
   - evidence: src/middleware/index.ts, src/middleware/cache-control.ts,
     src/middleware/csp.ts, src/layouts/Layout.astro

8. `architecture/routing-and-navigation.md`
   - slug: routing-and-navigation
   - purpose: Maps the full `src/pages/` route surface, the split between
     legacy navigation (`Navigation.astro`/`NavBar.svelte`) and the
     self-contained `-new` navigation (`HomeNavbar.astro`/`FooterSection.astro`),
     and how the sitemap filter and `public/_redirects` keep them separate.
   - links: concepts/the-new-page-pattern, reference/route-inventory,
     reference/sitemap-and-redirects, architecture/pages/home-new-composition
   - evidence: src/pages/ (route inventory), src/components/Navigation.astro,
     src/components/NavBar.svelte, src/components/home/HomeNavbar.astro,
     src/components/navigation.ts, src/pages/404.astro

9. `architecture/api-route-conventions.md`
   - slug: api-route-conventions
   - purpose: Explains the shared shape every `src/pages/api/*.ts` route
     follows — `prerender = false`, `getEnv()` for secrets, Origin
     allowlisting before body parsing, generic error responses, Sentry
     error reporting with `waitUntil` flush — as the contract new routes
     must match.
   - links: decisions/security-hardening-baseline, reference/api-routes,
     guides/add-an-api-route, concepts/environment-variable-resolution
   - evidence: docs/API.md, src/pages/api/donation-complete.ts,
     src/pages/api/endorsement-request.ts, src/lib/report-error.ts

10. `architecture/integrations/notion-client.md`
    - slug: notion-client
    - purpose: Describes `src/store/notionClient.ts` end to end — the
      per-call axios instance, each exported fetch function, the
      moderator/speaker resolution in `fetchNotionAgenda`, and the UTC
      timezone-resolution logic in `fetchCommunityCalls`.
    - links: concepts/notion-as-data-source, reference/notion-databases,
      architecture/pages/community-call-feature
    - evidence: src/store/notionClient.ts, src/pages/api/events.ts,
      src/pages/api/faq.ts, src/pages/api/ideas.ts, src/pages/api/speakers.ts,
      docs/EVENTS.md

11. `architecture/integrations/projecthub-directory.md`
    - slug: projecthub-directory
    - purpose: Traces the ProjectHub integration end to end: server-side
      `/api/projects` proxy with retry/backoff and URL sanitization, and the
      client-side `ProjectsDirectory.tsx` search/filter/drawer feature it feeds.
    - links: architecture/api-route-conventions, decisions/security-hardening-baseline
    - evidence: src/pages/api/projects.ts, src/components/projects/ProjectsDirectory.tsx,
      src/components/projects/projectData.ts, src/components/projects/ProjectDrawer.tsx,
      docs/PROJECTS.md

12. `architecture/integrations/donation-conversion-pipeline.md`
    - slug: donation-conversion-pipeline
    - purpose: Traces the QGIV → `donation-complete`/`membership-complete` →
      EmailOctopus/Hub flow, the separate Plausible `pipe.ts` proxy, the
      `DROPPED_CONVERSIONS` KV fallback for ad-blocked conversion events, and
      how the admin dashboard merges both.
    - links: architecture/api-route-conventions, decisions/security-hardening-baseline,
      reference/environment-variables
    - evidence: src/pages/api/donation-complete.ts, src/pages/api/membership-complete.ts,
      src/pages/api/pipe.ts, src/pages/api/admin/conversion-stats.ts,
      src/pages/admin/conversions.astro, wrangler.toml, docs/DONATIONS.md

13. `architecture/integrations/generic-form-proxy.md`
    - slug: generic-form-proxy
    - purpose: Explains `project-proxy.ts` (path normalization + header
      allowlist pattern for the Frappe/ProjectHub backend) plus the
      `store/api.ts` client helpers and shared `hook-form` infrastructure
      that `volunteerForm.tsx` uses, and why `PledgeForm.tsx`/`EndorsementForm.tsx`
      deliberately do not use it.
    - links: architecture/api-route-conventions, decisions/security-hardening-baseline
    - evidence: src/pages/api/project-proxy.ts, src/store/api.ts,
      src/components/hook-form/, src/components/volunteerForm.tsx,
      src/components/inputs-mapping.tsx, src/utils/helpers.ts

14. `architecture/pages/home-new-composition.md`
    - slug: home-new-composition
    - purpose: Explains how `home-new.astro` composes the eleven `src/components/home/*`
      section components into the redesigned homepage, and how it differs
      structurally from the legacy `index.astro`/`Layout.astro` page.
    - links: concepts/design-system, concepts/client-side-ab-testing,
      architecture/routing-and-navigation
    - evidence: src/pages/home-new.astro, src/layouts/HomeLayout.astro,
      src/components/home/HeroSection.astro, src/components/home/PortfolioSection.astro,
      src/components/home/CtaSection.astro, src/components/home/OpeningsSection.astro

15. `architecture/pages/community-call-feature.md`
    - slug: community-call-feature
    - purpose: Explains the `/community-call` feature — a permanent,
      Notion-driven page answering "when is the next call" — its
      client-computed live-detection window, the non-dismissible banner, and
      why it inverts the repo's `-new` convention.
    - links: decisions/community-call-url-inversion, architecture/integrations/notion-client,
      concepts/the-new-page-pattern
    - evidence: docs/superpowers/specs/2026-07-15-community-call-design.md,
      src/pages/community-call.astro, src/pages/community-call-old.astro,
      src/components/CommunityCallBanner.astro, src/utils/communityCall.ts,
      src/utils/formatCallTime.ts

### guides/

16. `guides/add-an-api-route.md`
    - slug: add-an-api-route
    - purpose: Task guide for adding a new `src/pages/api/*.ts` route that
      matches repo conventions (Origin check, `getEnv`, validation, generic
      errors, Sentry reporting) and passes the automated security review gate.
    - links: architecture/api-route-conventions, decisions/security-hardening-baseline,
      reference/api-routes
    - evidence: docs/API.md, src/pages/api/endorsement-request.ts,
      .github/workflows/claude-code-review.yml

17. `guides/retire-a-page.md`
    - slug: retire-a-page
    - purpose: Task guide for safely removing or renaming a page: add a 301
      in `public/_redirects`, and add any remaining test/orphan page to the
      sitemap `filter` exclude list.
    - links: concepts/the-new-page-pattern, reference/sitemap-and-redirects,
      reference/route-inventory
    - evidence: CLAUDE.md, public/_redirects, astro.config.mjs

18. `guides/debug-notion-data-not-showing.md`
    - slug: debug-notion-data-not-showing
    - purpose: Task guide for diagnosing why Notion-backed content (events,
      FAQ, ideas, community calls) isn't appearing: check `Visibility`,
      check for a renamed property, check image URL expiry.
    - links: concepts/notion-as-data-source, architecture/integrations/notion-client,
      reference/notion-databases
    - evidence: docs/EVENTS.md, docs/NOTION.md, src/store/notionClient.ts,
      src/components/events/EventsNew.tsx

19. `guides/verify-csp-changes-locally.md`
    - slug: verify-csp-changes-locally
    - purpose: Task guide explaining that CSP is not enforced under `pnpm dev`
      (no `HTMLRewriter`) and how to actually verify a CSP/middleware change
      (preview deploy, header inspection) before merging.
    - links: architecture/request-middleware, decisions/middleware-order-and-single-entrypoint
    - evidence: src/middleware/csp.ts, docs/ARCHITECTURE.md, docs/SECURITY.md

20. `guides/add-an-environment-variable.md`
    - slug: add-an-environment-variable
    - purpose: Task guide for correctly wiring a new environment variable
      through `getEnv()`, `.env.example`, `.dev.vars`, and both Cloudflare
      Pages dashboard environments, using the documented gaps as cautionary
      examples.
    - links: concepts/environment-variable-resolution, reference/environment-variables
    - evidence: docs/ENVIRONMENT.md, .env.example, src/utils/getEnv.ts

21. `guides/ship-a-change.md`
    - slug: ship-a-change
    - purpose: Task guide for getting a change safely to production: local
      `pnpm check`/`pnpm build`, what `ci.yml` enforces, the weekly
      `link-check.yml` gate, and Cloudflare Pages preview cleanup on merge.
    - links: architecture/rendering-and-deployment, decisions/security-hardening-baseline
    - evidence: .github/workflows/ci.yml, .github/workflows/link-check.yml,
      .github/workflows/cleanup-cf-preview.yml, .lycheerc.toml, DEPLOYMENT.md

### decisions/

22. `decisions/middleware-order-and-single-entrypoint.md`
    - slug: middleware-order-and-single-entrypoint
    - purpose: Records the decision to run exactly one middleware entry
      point (`src/middleware/index.ts`) with `cache-control` strictly before
      `csp` in the `sequence()`, tied to two distinct production incidents
      (over-broad `Cache-Control` caching; a shadow `middleware.ts` that
      silently disabled the real one).
    - links: architecture/request-middleware, reference/security-audit-findings
    - evidence: src/middleware/index.ts, docs/SECURITY.md,
      security_audit/security-audit-findings.csv

23. `decisions/security-hardening-baseline.md`
    - slug: security-hardening-baseline
    - purpose: Records the accumulated security ruleset from six audit
      rounds (secrets never client-side, webhook auth via signed header not
      query param, constant-time comparisons, Origin validation before body
      parsing, proxy path normalization + header allowlists, no wildcard
      CORS on write endpoints, generic client-facing errors) and the
      automated PR gate that now enforces the highest-risk surface.
    - links: architecture/api-route-conventions, reference/security-audit-findings,
      guides/add-an-api-route
    - evidence: docs/SECURITY.md, security_audit/security-audit-findings.csv,
      .github/workflows/claude-code-review.yml, src/utils/crypto.ts,
      src/pages/api/project-proxy.ts, src/pages/api/sentry-webhook.ts

24. `decisions/homepage-ab-test-strategy.md`
    - slug: homepage-ab-test-strategy
    - purpose: Records the approved decision to A/B test the redesigned
      homepage via a client-side, localStorage-based anti-flicker script
      instead of middleware/cookies, and the documented plan for ending the
      test either way.
    - links: concepts/client-side-ab-testing, architecture/pages/home-new-composition,
      concepts/the-new-page-pattern
    - evidence: docs/superpowers/specs/2026-06-30-homepage-ab-test-design.md,
      docs/superpowers/plans/2026-06-30-homepage-ab-test.md, src/pages/index.astro

25. `decisions/community-call-url-inversion.md`
    - slug: community-call-url-inversion
    - purpose: Records the decision to make `/community-call` (not
      `-old`) the canonical, indexed URL — inverting the repo's usual `-new`
      convention — plus the one-row-per-call Notion schema and client-side
      live-window detection chosen to keep a permanently shareable link
      accurate without code changes.
    - links: architecture/pages/community-call-feature, concepts/the-new-page-pattern,
      architecture/integrations/notion-client
    - evidence: docs/superpowers/specs/2026-07-15-community-call-design.md,
      src/pages/community-call.astro, src/pages/community-call-old.astro

26. `decisions/empty-content-collections.md`
    - slug: empty-content-collections
    - purpose: Records that Astro content collections (`src/content/`) were
      emptied out (`collections = {}`) as content moved to Notion (events,
      FAQ, ideas) and ProjectHub (projects), and flags that `AGENTS.md`
      still describes the old local-markdown-collections setup and is stale
      on this point.
    - links: architecture/rendering-and-deployment, concepts/notion-as-data-source,
      architecture/integrations/projecthub-directory
    - evidence: src/content/config.ts, docs/ARCHITECTURE.md, AGENTS.md

### reference/

27. `reference/api-routes.md`
    - slug: api-routes
    - purpose: Exact lookup table of every `src/pages/api/*.ts` route: HTTP
      method, auth/Origin check, upstream service, and notable behavior.
    - links: architecture/api-route-conventions, guides/add-an-api-route
    - evidence: docs/API.md, src/pages/api/ (all route files)

28. `reference/environment-variables.md`
    - slug: environment-variables
    - purpose: Exact lookup table of every environment variable: subsystem,
      resolution tier, presence in `.env.example`/`.dev.vars`, and known gaps.
    - links: concepts/environment-variable-resolution, guides/add-an-environment-variable
    - evidence: docs/ENVIRONMENT.md, DEPLOYMENT.md, .env.example

29. `reference/notion-databases.md`
    - slug: notion-databases
    - purpose: Exact lookup table of the Notion databases used by the site:
      env var id, consuming route(s), key properties, and the unused
      `NOTION_SPEAKERS_DB_ID`.
    - links: concepts/notion-as-data-source, architecture/integrations/notion-client
    - evidence: docs/NOTION.md, src/store/notionClient.ts,
      docs/superpowers/specs/2026-07-15-community-call-design.md

30. `reference/route-inventory.md`
    - slug: route-inventory
    - purpose: Exact lookup list of every page route under `src/pages/`,
      grouped into legacy/`-new` pairs and standalone/orphan pages, with the
      two non-`.astro` files (`_incubator.old`, `project-details-temp.astro`)
      called out.
    - links: architecture/routing-and-navigation, concepts/the-new-page-pattern
    - evidence: src/pages/ (full route listing), astro.config.mjs

31. `reference/sitemap-and-redirects.md`
    - slug: sitemap-and-redirects
    - purpose: Exact lookup reference for the sitemap `filter` exclude array
      in `astro.config.mjs` and every rule in `public/_redirects`.
    - links: guides/retire-a-page, architecture/routing-and-navigation
    - evidence: astro.config.mjs, public/_redirects

32. `reference/design-token-values.md`
    - slug: design-token-values
    - purpose: Exact lookup table of the design token values (colors, font
      families, border radii) as implemented in `tailwind.config.mjs`,
      cross-referenced against the `DESIGN.md` specification.
    - links: concepts/design-system, architecture/pages/home-new-composition
    - evidence: tailwind.config.mjs, DESIGN.md

33. `reference/security-audit-findings.md`
    - slug: security-audit-findings
    - purpose: Exact lookup table of the security audit findings (ID,
      category, severity, status) from `security-audit-findings.csv`,
      including the one still-open finding.
    - links: decisions/security-hardening-baseline, decisions/middleware-order-and-single-entrypoint
    - evidence: security_audit/security-audit-findings.csv, docs/SECURITY.md

## Totals

- concepts: 5
- architecture: 10 (4 top-level, 4 under `integrations/`, 2 under `pages/`)
- guides: 6
- decisions: 5
- reference: 7
- routing: `getting-started.md`

34 content pages plus `getting-started.md`, written across writing-agent waves
grouped roughly by folder and dependency order (concepts and architecture
first, since guides/decisions/reference link back to them).
