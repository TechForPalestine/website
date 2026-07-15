# Architecture

Big-picture map of how the site is built and deployed. For env vars see [DEPLOYMENT.md](../DEPLOYMENT.md); for the security model see [SECURITY.md](SECURITY.md).

## Rendering model

The site runs in Astro's `output: "server"` mode (`astro.config.mjs`) on the `@astrojs/cloudflare` adapter, deployed to Cloudflare Pages with `nodejs_compat` (`wrangler.toml`). Almost every page is server-rendered per request rather than statically prebuilt at build time.

React and Svelte components are client islands. Most are mounted with `client:only="react"` (or `client:load`), meaning they render nothing during SSR and hydrate fully in the browser — the Astro page shell fetches initial data server-side and passes it as props, then the island takes over for interactivity/polling.

## Request pipeline (middleware)

`src/middleware/index.ts` is the **only** middleware entry point, chaining two middlewares via `sequence()`:

```ts
export const onRequest = sequence(cacheControl, csp);
```

1. **`cache-control.ts`** runs first. It sets `Cache-Control: no-store` on all `/api/*` routes and non-GET requests, and `public, max-age=600` on other GET responses (unless already set).
2. **`csp.ts`** runs second. It generates a per-request nonce, calls `next()`, and if the response is `text/html`, uses Cloudflare's `HTMLRewriter` to inject the nonce onto every `<script>`/`<style>` tag and set a strict `Content-Security-Policy` header (`script-src 'nonce-... strict-dynamic'`, no `'unsafe-inline'`). In local dev, `HTMLRewriter` isn't available, so CSP injection is skipped entirely (not enforced in `pnpm dev`).

**Ordering matters**: `csp` can replace the entire `Response` object via `HTMLRewriter.transform()`, so `cache-control` must run first — otherwise its header would be lost on the rewritten response. Do not add a second `src/middleware.ts` file; it would silently shadow `src/middleware/index.ts` and disable both cache headers and CSP.

## Data sources

| Source                                                             | Client / integration point                                                                                                  | Used for                                                                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Notion**                                                         | `src/store/notionClient.ts` (axios) + a few routes use `@notionhq/client` directly                                          | Events, FAQ, ideas, agenda/speakers, E4P pledge signatories, endorsement requests, community calls — 8 databases total, see [NOTION.md](NOTION.md) |
| **ProjectHub** (`projecthub.techforpalestine.org`)                 | `src/pages/api/projects.ts` calls the public API directly                                                                   | `/projects`, `/projects-new` incubator directory — see [PROJECTS.md](PROJECTS.md)                                                                  |
| **Generic authenticated upstream** (`PUBLIC_API_URL`)              | `src/store/api.ts` (axios) → `src/pages/api/project-proxy.ts`                                                               | Volunteer/incubator application forms (`volunteerForm.tsx`, `inputs-mapping.tsx`)                                                                  |
| **Cloudflare KV** (`DROPPED_CONVERSIONS` binding, `wrangler.toml`) | `src/pages/api/pipe.ts` (write), `src/pages/api/admin/conversion-stats.ts` (read)                                           | Fallback log of ad-blocked/dropped Plausible conversion events — see [DONATIONS.md](DONATIONS.md)                                                  |
| **Plausible Analytics**                                            | `api/pipe.ts` (event proxy), `api/admin/conversion-stats.ts` (stats query API)                                              | Donation/membership conversion tracking                                                                                                            |
| **QGIV**                                                           | Embedded donation widget (client-side, CSP-allowlisted) + `donation-complete`/`membership-complete` callbacks               | Payment processing                                                                                                                                 |
| **EmailOctopus**                                                   | `api/donation-complete.ts`, `api/membership-complete.ts`                                                                    | Donor/member mailing list sync                                                                                                                     |
| **Sentry**                                                         | `sentry.client.config.js`, `sentry.server.config.js`, `src/lib/report-error.ts`, inbound webhook at `api/sentry-webhook.ts` | Error monitoring + Mattermost alert relay                                                                                                          |

## Content collections

`src/content/config.ts` currently defines `collections = {}` — empty. Older documentation and some historical plans reference markdown-based `ideas/`/`projects/` content collections; that data now comes from Notion and ProjectHub respectively (see tables above). Don't assume `src/content/` holds live data without checking the collections config first.

## Environment variables

Always resolve env vars through `getEnv(name, locals)` (`src/utils/getEnv.ts`), which checks, in order: Cloudflare runtime env (`locals.runtime.env`) → `import.meta.env` (build-time) → `process.env` (Node/dev). Never read `process.env` directly in code that runs on the Cloudflare Pages runtime — the runtime env is only reachable through `locals`.

## The "-new" duplicate-page pattern

Many routes exist in pairs, e.g. `about.astro`/`about-new.astro`, `events.astro`/`events-new.astro`, `donate.astro`/`donate-2.astro`/`donate-new.astro`. The `-new` variants are redesign/A/B-test pages, not linked from site navigation (see `docs/superpowers/specs/2026-06-30-homepage-ab-test-design.md` for the design rationale behind the current redesign wave). They are deliberately excluded from the sitemap via the `filter` callback passed to `sitemap()` in `astro.config.mjs`.

**Any new experimental, staging, or orphan page must be added to that same exclude list** — Google should only index pages reachable through real navigation.

## Directory layout

```
src/
├── components/       # React/Astro/Svelte components, grouped by feature (events/, home/, hook-form/, projects/, ui/, membership/, london-gathering/)
├── content/          # Content collections config — currently empty, see note above
├── layouts/          # Layout.astro, HomeLayout.astro
├── lib/              # report-error.ts (Sentry wrapper)
├── middleware/        # index.ts (sequence entry point), cache-control.ts, csp.ts
├── pages/             # File-based routes; api/ for endpoints, admin/ for internal tools
├── store/             # notionClient.ts, api.ts (generic proxy client)
├── structures/         # Reusable Astro structural components (forms, buttons)
├── styles/            # Tailwind entry (base.css)
├── types/             # Shared TypeScript types
└── utils/             # getEnv.ts, crypto.ts, basicAuth.ts, helpers.ts
```

## Deployment

Site deploys automatically to Cloudflare Pages on push to `main`. Build command `pnpm build`, output directory `dist/`. See [DEPLOYMENT.md](../DEPLOYMENT.md) for the full environment variable list.
