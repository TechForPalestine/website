---
title: "Environment Variable Resolution (getEnv)"
summary: "getEnv() resolves every environment variable through a three-tier fallback (Cloudflare runtime env, then import.meta.env, then process.env) because a bare process.env read is silently undefined in production on the Cloudflare Pages Workers runtime."
topics: [architecture, configuration, deployment]
sources:
  - id: get-env
    type: file
    path: src/utils/getEnv.ts
  - id: environment-md
    type: file
    path: docs/ENVIRONMENT.md
  - id: claude-md
    type: file
    path: CLAUDE.md
---

`getEnv(name, locals)` is the single function every route and page in the T4P website is expected to call whenever it needs a secret or configuration value, instead of reading `process.env` directly [@claude-md]. The reason it exists is that this site runs on Cloudflare Pages via the `@astrojs/cloudflare` adapter, and Cloudflare's Workers runtime does not populate Node's `process.env` with the values set in the Pages dashboard — a plain `process.env.SOME_SECRET` read in a route handler comes back `undefined` in production even when the value is correctly configured, because it was never a `process.env` value to begin with. `getEnv()` exists to hide that platform quirk behind one function so a developer never has to remember which of three different mechanisms actually holds a given value at runtime.

## The three tiers, in order

```js
if (locals?.runtime?.env?.[name]) return locals.runtime.env[name];
if (import.meta.env[name]) return import.meta.env[name];
if (typeof process !== "undefined" && process.env?.[name]) return process.env[name];
return undefined;
```

`getEnv.ts` checks these in exactly this order and returns on the first hit [@get-env]. Each tier corresponds to a different loading mechanism:

1. **`locals.runtime.env[name]`** — populated per-request by the Cloudflare adapter. In production, this is where every variable set in the Cloudflare Pages dashboard (Settings → Environment variables) actually lands. Locally, Wrangler's `getPlatformProxy()` (invoked automatically by `@astrojs/cloudflare` in dev mode) fills this same object from the repo-root `.dev.vars` file, so a variable set there behaves identically to a dashboard variable — including winning over any conflicting value in `.env` [@environment-md].
2. **`import.meta.env[name]`** — Vite's build-time environment, populated from the repo-root `.env` file via Vite's built-in dotenv loader. This tier only exists locally; there is no `.env` file at all in the Cloudflare Pages production environment [@environment-md].
3. **`process.env[name]`** — Node's process environment. Locally this is reachable two ways: Vite's Node process also mirrors `.env` values here, and the Cloudflare adapter's `setProcessEnv` additionally copies `.dev.vars` values into `process.env` for compatibility with libraries that read it directly. In production, on the Workers runtime, this tier is essentially inert for anything set only in the Cloudflare dashboard — it is not where dashboard secrets end up [@environment-md].

Because tier 1 is checked first and matches both the dashboard (prod/preview) and `.dev.vars` (dev), a variable that exists in *both* `.dev.vars` and `.env` locally resolves to the `.dev.vars` value — which is also the behavior that will actually occur in production, since production has no `.env` equivalent at all [@environment-md]. This makes `.dev.vars` the tier that most faithfully simulates what a route will see once deployed, and `.env` a build-time-only convenience that can silently diverge from production behavior if a value is set there but never added to `.dev.vars` or the dashboard.

## Why a bare `process.env` read is unsafe here

The failure mode `getEnv()` prevents is specific and easy to miss in local testing: code that reads `process.env.X` directly still works during `pnpm dev`, because `.dev.vars` gets mirrored into `process.env` locally by the adapter's `setProcessEnv` [@environment-md]. The same code deployed to Cloudflare Pages, where only `locals.runtime.env` is populated from the dashboard, silently receives `undefined` instead — no error, just a missing value flowing into whatever fallback the calling code has (commonly a 500/503 response or a feature flag defaulting to off) [@environment-md]. `CLAUDE.md` states this as a flat rule: never read `process.env` directly in code that runs on the Cloudflare Pages runtime, always resolve through `getEnv(name, locals)` [@claude-md]. A small number of build-time-only values are the documented exception — `astro.config.mjs`'s `process.env.SENTRY_AUTH_TOKEN` and the Sentry config files read `process.env`/`import.meta.env` directly because they run before any request exists, not during one [@environment-md].

## Consequence for anyone adding a variable

Because `getEnv()`'s tier 1 is the only one that matches production, wiring in a new variable is not finished after it works in `pnpm dev` — a value that only exists in local `.env` will resolve fine through tier 2 locally and then return `undefined` in production, since the Cloudflare Pages dashboard is the only place tier 1 gets populated at deploy time. Confirming a variable is set in the dashboard (for both Production and Preview environments, since they're configured separately) is the step that closes that gap. This is the mental model behind [Notion as the site's data source](notion-as-data-source), where every `NOTION_*` credential the fetchers depend on is resolved through this same `getEnv(name, locals)` call rather than a direct `process.env` read.
