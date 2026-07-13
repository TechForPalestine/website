# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tech for Palestine Website** - A community platform showcasing projects, events, and resources for tech workers supporting Palestine. Built with Astro, React, Svelte, TypeScript, and Notion API integration.

- **Repository**: https://github.com/techforpalestine/website.git
- **Main Branch**: `main`
- **Tech Stack**: Astro v5 (SSR, `output: "server"`), React 19, Svelte 5, TypeScript, Tailwind CSS, Material-UI v6, Notion API
- **Deployment**: Cloudflare Pages (via `@astrojs/cloudflare` adapter, `nodejs_compat`)
- **Package Manager**: `pnpm` (v9+, required by `packageManager` field — do not use `yarn` or `npx astro` directly)

## Common Commands

```bash
pnpm install         # Install dependencies
pnpm dev              # Start dev server at http://localhost:4321 (alias: pnpm start)
pnpm build            # Build for production (outputs to dist/)
pnpm preview           # Preview the production build locally
pnpm check             # Type-check via `astro check`
pnpm format            # Format with Prettier (writes)
pnpm format:check      # Format check only (CI)
```

For CI/reproducible installs, `npm ci` is also supported (both `package-lock.json` and `pnpm-lock.yaml` are checked in — prefer `pnpm` for local dev).

No test framework is currently configured. If adding tests, prefer Vitest + @testing-library, colocated as `*.test.ts(x)` or under `src/__tests__/`.

## Architecture

### Rendering model

Astro runs in `output: "server"` mode on the Cloudflare adapter — nearly every page is SSR'd per-request, not statically prebuilt. React/Svelte components are client-side islands, typically mounted with `client:only="react"` (they render nothing at build/SSR time and hydrate fully in-browser).

### Request pipeline (middleware)

`src/middleware/index.ts` chains two middlewares via `sequence()`, in this order:

1. `cache-control.ts` — sets `Cache-Control` headers (API routes get `no-store`)
2. `csp.ts` — injects a per-request CSP nonce into inline `<script>`/`<style>` tags via Cloudflare `HTMLRewriter`, and may rewrite the response

Because `csp` can replace the response object, `cache-control` must run first so its header survives the rewrite. There must only ever be one middleware entry point (`src/middleware/index.ts`) — a parallel `src/middleware.ts` would silently shadow it.

### The "-new" duplicate-page pattern

Many routes exist in pairs, e.g. `about.astro` / `about-new.astro`, `events.astro` / `events-new.astro`, `donate.astro` / `donate-2.astro` / `donate-new.astro`. The `-new` variants are redesign/test pages not linked from site navigation. They are deliberately excluded from the sitemap via the `filter` list in `sitemap()` in `astro.config.mjs` — any new experimental/orphan page must be added to that same exclude list so Google doesn't index unreachable pages.

### Data sources

- **Notion API** (`src/store/notionClient.ts`) — events and other dynamic content via `fetchNotionEvents()` / `fetchNotionEventById()`. Images are direct Notion-hosted URLs (no proxy/cache — that worker was removed), expire after ~1hr, client falls back to `/images/default.jpg` on load error. See `docs/EVENTS.md` / `docs/NOTION.md`.
- **ProjectHub** (external service) — `src/pages/api/projects.ts` calls `projecthub.techforpalestine.org/api/public/projects` directly and is fetched client-side via `/api/projects` by both `ProjectsDirectory.tsx` and `ProjectsNew.tsx`. `src/pages/api/project-proxy.ts` is unrelated — it's a generic authenticated proxy used only by the volunteer/incubator application forms. See `docs/PROJECTS.md`.
- **Cloudflare KV** — `DROPPED_CONVERSIONS` namespace (bound in `wrangler.toml`) is used for conversion tracking, surfaced at `src/pages/admin/conversions.astro` and `src/pages/api/admin/conversion-stats.ts`.
- **Content collections** (`src/content/config.ts`) — currently empty (`collections = {}`); older docs referencing `content/ideas` and `content/projects` markdown collections are stale — check `src/content/` before relying on this.

### Environment variables

Always resolve env vars through `getEnv(name, locals)` (`src/utils/getEnv.ts`), which falls back across Cloudflare runtime env → `import.meta.env` → `process.env` in that order. Never read `process.env` directly in code that runs on the Cloudflare Pages runtime. For local dev, `.dev.vars` populates the first tier (matches production), `.env` only reaches the second/third — see `docs/ENVIRONMENT.md` for the full mechanism and a variable-by-variable audit.

## Security Model

This project has undergone multiple rounds of security auditing (see `security_audit/`). These rules come directly from findings that were fixed — do not regress them.

- **Secrets** live only in the Cloudflare Pages dashboard env vars, never hardcoded in `wrangler.toml`, `astro.config.mjs`, or source. Resolve via `getEnv()`. Never import/reference secrets in client-executed code (e.g. `src/store/api.ts`) — add a server-side proxy route under `src/pages/api/` instead.
- **Webhooks** authenticate via header (`X-Webhook-Secret` or `Authorization: Bearer`), never a URL query param (those leak into access logs).
- **Secret comparison** must use `constantTimeEqual(a, b)` from `src/utils/crypto.ts`, never `===`.
- **Proxy routes** (`src/pages/api/project-proxy.ts` is the existing example) must normalize the upstream path with `new URL(path, "http://localhost").pathname` before checking it against an explicit allowed prefix, and must build an explicit header allowlist rather than forwarding all incoming headers (which would leak `Cookie`, `X-Forwarded-For`, etc.).
- **CORS**: never `Access-Control-Allow-Origin: *` on write endpoints (POST/PUT/PATCH/DELETE) — use `https://techforpalestine.org` explicitly. Read-only GET endpoints serving public data may use `*`.
- **CSP**: managed only in `src/middleware/csp.ts` via per-request nonces (HTMLRewriter). Never add `'unsafe-inline'` to `script-src`/`style-src`, never use `style=""` inline attributes (silently blocked in prod, appears to work in devtools), and don't add new external script origins without review.
- **Public POST endpoints** must validate required fields, email format, URL format (`try { new URL(value) } catch`), cap free-text at 2000 chars, and reject if `Origin !== "https://techforpalestine.org"` before parsing the body.
- **Errors**: never return raw error objects/stack traces to clients — generic message + `console.error` server-side only. Never log full secrets or PII (emails: `[redacted]@${domain}` only).

## Routing & Redirects

- When removing or renaming a page, add a 301 redirect in `public/_redirects` pointing to the closest equivalent page.
- Custom 404 lives at `src/pages/404.astro`, using the standard `Layout.astro` (keep site nav visible).
- Any test/staging/orphan page must be added to the sitemap `filter` exclude list in `astro.config.mjs` (see the `-new` pattern above).

## Directory Structure

```
src/
├── components/       # React/Astro/Svelte components (events/, home/, hook-form/, projects/, ui/, membership/, london-gathering/)
├── content/          # Content collections config (currently empty — see note above)
├── layouts/          # Layout.astro (shared page layout)
├── lib/              # report-error.ts
├── middleware/        # index.ts (sequence entry point), cache-control.ts, csp.ts
├── pages/             # File-based routes; api/ for endpoints, admin/ for internal tools
├── store/             # Notion client and data-fetching utilities
├── structures/         # Reusable Astro structural components (forms, buttons)
├── styles/            # Tailwind entry (base.css)
├── types/             # Shared TypeScript types
└── utils/             # getEnv.ts, crypto.ts, basicAuth.ts, helpers.ts
```

## File Naming

- Pages: `kebab-case.astro`
- Components: `PascalCase.tsx/jsx/astro/svelte`
- Utilities: `camelCase.ts`
- Content: `kebab-case.md`

## Documentation

Full index: [docs/README.md](docs/README.md). Highlights: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (middleware chain, data sources, the `-new` page pattern), [docs/API.md](docs/API.md) (every route's auth/upstream), [docs/SECURITY.md](docs/SECURITY.md) (audit-derived rules with the incident behind each), [DEPLOYMENT.md](DEPLOYMENT.md) (full env var list).

## Branch Management

Always verify the working branch hasn't been merged before committing. Use `git log --oneline main..HEAD` to check for unmerged commits before starting new work on a branch.

- When I say "ship it" I want you to create a new branch (if we're on main or a previously merged feature branch), stage and commit new edits, push it to github and open a PR.
