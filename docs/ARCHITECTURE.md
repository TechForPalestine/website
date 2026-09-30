# Architecture

Big-picture map of how the site is built and deployed. For env vars see [DEPLOYMENT.md](../DEPLOYMENT.md); for the security model see [SECURITY.md](SECURITY.md).

## Rendering model

The site runs in Astro's `output: "server"` mode (`astro.config.mjs`) on the `@astrojs/cloudflare` adapter, deployed to Cloudflare Pages with `nodejs_compat` (`wrangler.toml`). Almost every page is server-rendered per request rather than statically prebuilt at build time.

React and Svelte components are client islands. Most are mounted with `client:only="react"` (or `client:load`), meaning they render nothing during SSR and hydrate fully in the browser — the Astro page shell fetches initial data server-side and passes it as props, then the island takes over for interactivity/polling.

## Request pipeline (middleware)

`src/middleware/index.ts` is the **only** middleware entry point, chaining four middlewares via `sequence()`:

```ts
export const onRequest = sequence(sentryInit, securityHeaders, cacheControl, csp);
```

1. **`sentry-init.ts`** configures the Sentry client so every later middleware and every route's `reportError()` call reports correctly (the module-level `sentry.server.config.js` cannot do this on Cloudflare Pages).
2. **`security-headers.ts`** sets `nosniff`, `Referrer-Policy` and `Permissions-Policy` on every SSR response (`public/_headers` does not reach them).
3. **`cache-control.ts`** sets `Cache-Control: no-store` on all `/api/*` routes and non-GET requests, and `public, max-age=600` on other GET responses (unless already set).
4. **`csp.ts`** generates a per-request nonce, calls `next()`, and if the response is `text/html`, uses Cloudflare's `HTMLRewriter` to inject the nonce onto every `<script>`/`<style>` tag and set a strict `Content-Security-Policy` header (`script-src 'nonce-... strict-dynamic'`, no `'unsafe-inline'`).

**In/out ordering**: a request passes through 1, 2, 3, 4 on the way in and the response passes back through 4, 3, 2, 1 on the way out. `csp` can replace the entire `Response` object via `HTMLRewriter.transform()`, so `securityHeaders` and `cacheControl` run before it; their headers are set on the response that `csp` then transforms and preserves. Do not add a second `src/middleware.ts` file; it would silently shadow `src/middleware/index.ts` and disable every middleware.

**CSP is only verifiable in production.** `HTMLRewriter` is absent in `pnpm dev`, so CSP injection is skipped entirely locally. Check CSP on a Cloudflare deployment.

## Data sources

| Source                                                             | Client / integration point                                                                                                  | Used for                                                                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notion**                                                         | `src/store/notionClient.ts` (axios) + a few routes use `@notionhq/client` directly                                          | Events, FAQ, ideas, agenda/speakers, E4P pledge signatories, endorsement requests, community calls — 8 databases total, see [NOTION.md](NOTION.md) |
| **ProjectHub** (`projecthub.techforpalestine.org`)                 | `src/pages/api/projects.ts` calls the public API directly                                                                   | `/projects` directory and `/projects/<slug>`; list cached 5 min in the Workers Cache API — see [PROJECTS.md](PROJECTS.md)                          |
| **Generic authenticated upstream** (`PUBLIC_API_URL`)              | `src/store/api.ts` (axios) → `src/pages/api/project-proxy.ts`                                                               | Volunteer/incubator application forms (`VolunteerForm.tsx`, `InputsMapping.tsx`)                                                                   |
| **Cloudflare KV** (`DROPPED_CONVERSIONS` binding, `wrangler.toml`) | `src/pages/api/pipe.ts` (write), `src/pages/api/admin/conversion-stats.ts` (read)                                           | Fallback log of ad-blocked/dropped Plausible conversion events — see [DONATIONS.md](DONATIONS.md)                                                  |
| **Plausible Analytics**                                            | `api/pipe.ts` (event proxy), `api/admin/conversion-stats.ts` (stats query API)                                              | Donation/membership conversion tracking                                                                                                            |
| **QGIV**                                                           | Embedded donation widget (client-side, CSP-allowlisted) + `donation-complete`/`membership-complete` callbacks               | Payment processing                                                                                                                                 |
| **EmailOctopus**                                                   | `api/donation-complete.ts`, `api/membership-complete.ts`                                                                    | Donor/member mailing list sync                                                                                                                     |
| **Sentry**                                                         | `sentry.client.config.js`, `sentry.server.config.js`, `src/lib/report-error.ts`, inbound webhook at `api/sentry-webhook.ts` | Error monitoring + Mattermost alert relay                                                                                                          |

## Content collections

`src/content/config.ts` currently defines `collections = {}` — empty. Older documentation and some historical plans reference markdown-based `ideas/`/`projects/` content collections; that data now comes from Notion and ProjectHub respectively (see tables above). Don't assume `src/content/` holds live data without checking the collections config first.

## Environment variables

Always resolve env vars through `getEnv(name, locals)` (`src/utils/getEnv.ts`), which checks, in order: Cloudflare runtime env (`locals.runtime.env`) → `import.meta.env` (build-time) → `process.env` (Node/dev). Never read `process.env` directly in code that runs on the Cloudflare Pages runtime — the runtime env is only reachable through `locals`.

## The abandoned "-new" redesign

**Do not build on `-new` pages, and do not create new ones.** All design work targets the live pages. The live design system is documented in [DESIGN.md](../DESIGN.md), derived from `/membership` as the canonical page.

A redesign wave once duplicated most routes as `about-new.astro`, `events-new.astro`, `donate-new.astro` and so on, excluded from the sitemap and unlinked from navigation. The homepage A/B test between `/` and `/home-new` decided it: the control won, and the wave was shelved in #524 (`915eb5a`). `docs/superpowers/specs/2026-06-30-homepage-ab-test-design.md` records that test and is kept as history, not as guidance.

What remains:

- 26 `-new.astro` files in `src/pages/`. 24 are dead: each is 301'd to its live counterpart in `public/_redirects` and therefore unreachable. Treat them as deleted; they are kept only to avoid a large deletion diff.
- `membership-new` and `supporting-member-new` are the exceptions: they are **live `noindex` pages** (excluded from the sitemap) that use `HomeLayout.astro`, `design-system.css` and the `home/` sections they need.
- `src/styles/design-system.css`, the Fraunces/parchment `ts-*` typography scale, is imported only by `HomeLayout` and `AdminLayout`.

Two traps worth knowing:

- **`ProjectsNew.tsx` is live.** Despite the name, it is the directory rendered by `/projects`. `EventsNew.tsx`, `IdeasWithTabsNew.tsx` and `SignatoriesNew.tsx` are not.
- **`ts-*` classes and `font-serif` silently degrade.** `Layout.astro` never imports `design-system.css`, so those classes are no-ops on every public page and render at browser default sizing.

**Any new experimental, staging, or orphan page must still be added to the sitemap `filter` exclude list** — Google should only index pages reachable through real navigation.

## Island directives

| Directive             | Use for                                                     |
| --------------------- | ----------------------------------------------------------- |
| `client:only="react"` | Islands that touch `window` or are MUI-only (no SSR output) |
| `client:load`         | Everything else (SSR-rendered, then hydrated)               |

Do not convert one to the other: `client:only` islands render nothing at SSR, so changing the directive changes the HTML and can break MUI or `window` usage.

## Caching and pagination

- **ProjectHub**: `/api/projects` serves the list through the Workers Cache API. Entries younger than 5 minutes are served as-is; older ones trigger a refetch, and if ProjectHub fails a stale copy up to 24 hours old is served (`src/utils/projectsCachePolicy.ts`, `src/store/projectsClient.ts`). The API route itself is `no-store` to browsers.
- **Notion**: queried live on each request with no server-side cache, and the clients do not follow pagination cursors, so only the first page of results is used.
- **Events ICS feed**: fetched live on each request (`fetchEvents`) with no cache; the whole feed is parsed every time.

## Directory layout

```
src/
├── components/       # React/Astro/Svelte components, grouped by feature (events/, home/, hook-form/, projects/, ui/, membership/, london-gathering/)
├── content/          # Content collections config, currently empty (see Content collections)
├── layouts/          # Layout.astro (public pages), AdminLayout.astro, HomeLayout.astro
├── lib/              # report-error.ts (Sentry wrapper), sentry-scrub.ts
├── middleware/        # index.ts (sequence entry point), sentry-init.ts, security-headers.ts, cache-control.ts, csp.ts
├── pages/             # File-based routes; api/ for endpoints, admin/ for internal tools
├── store/             # notionClient.ts, eventsClient.ts (ICS), projectsClient.ts (ProjectHub + Workers cache), api.ts (generic proxy client)
├── structures/         # Reusable Astro structural components (forms, buttons)
├── styles/            # Tailwind entry (base.css)
├── types/             # Shared TypeScript types
└── utils/             # getEnv.ts, crypto.ts (constantTimeEqual), origin.ts (Origin allowlist + CORS headers), qgivVerify.ts, transactionReplay.ts, basicAuth.ts, helpers.ts, plus event/project helpers
```

## Deployment

Site deploys automatically to Cloudflare Pages on push to `main`. Build command `pnpm build`, output directory `dist/`. See [DEPLOYMENT.md](../DEPLOYMENT.md) for the full environment variable list.
