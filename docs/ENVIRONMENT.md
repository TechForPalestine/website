# Environment Variables: How They Actually Get Loaded

This project has **three different places** a variable can live — `.env`, `.dev.vars`, and the Cloudflare Pages dashboard — and they don't all do the same thing. This doc explains the mechanism precisely enough to audit against, and lists every variable the code actually reads.

## The three tiers

| Tier | File / location | Loaded by | Reachable in code as | Committed? |
|---|---|---|---|---|
| 1 | **Cloudflare Pages dashboard** (Settings → Environment variables, per environment: Production / Preview) | Cloudflare, at request time | `locals.runtime.env.X` | N/A — not a file |
| 2 | **`.dev.vars`** (repo root) | Wrangler's `getPlatformProxy()`, invoked automatically by `@astrojs/cloudflare` in dev mode (`platformProxy.enabled` defaults to `true`) | `locals.runtime.env.X` — **and** also copied into `process.env.X` by the adapter (`setProcessEnv`) | No — gitignored |
| 3 | **`.env`** (repo root) | Vite's built-in dotenv loader | `import.meta.env.X`, and via Vite's Node process also `process.env.X` | No — gitignored |

`.env.example` (committed) documents which vars exist; it's not loaded by anything at runtime — it's a template to copy from.

### Why two different local files?

`.dev.vars` exists to **simulate the Cloudflare Pages runtime** in dev — anything set there shows up exactly where it would in production, at `locals.runtime.env`. `.env` is the generic Vite/Node mechanism and only reaches `import.meta.env`/`process.env`, never `locals.runtime.env`. In production there is no `.env` or `.dev.vars` at all — only the dashboard populates `locals.runtime.env`.

### How `getEnv()` resolves this

`src/utils/getEnv.ts` checks, in order:

```
1. locals.runtime.env[name]   ← Cloudflare dashboard (prod/preview) OR .dev.vars (dev)
2. import.meta.env[name]      ← .env (Vite build-time)
3. process.env[name]          ← .env (Node) OR .dev.vars (copied in by the adapter)
```

**Practical effect:** if a variable is set in *both* `.dev.vars` and `.env` with different values, `.dev.vars` wins locally (tier 1 beats tier 2/3) — matching what would happen in production, where only the dashboard value exists. If it's in neither, `getEnv()` returns `undefined` and the calling route/component gets whatever fallback it has (usually a 500/503, or a feature flag defaulting to off).

### Build-time-only variables (bypass `getEnv()` entirely)

A few variables are read directly via `process.env` / `import.meta.env` in config files rather than through `getEnv()`, because they're needed before a request ever happens:

- `astro.config.mjs`: `process.env.SENTRY_AUTH_TOKEN` — read at `pnpm build` time to enable source-map upload. Must be set wherever the build runs (Cloudflare Pages build environment — same dashboard UI, but note it needs to be available at **build** time, not just runtime).
- `sentry.server.config.js`: `process.env.SENTRY_DSN`, `process.env.SENTRY_ENVIRONMENT`
- `sentry.client.config.js`: `import.meta.env.PUBLIC_SENTRY_DSN`, `import.meta.env.PUBLIC_SENTRY_ENVIRONMENT` — `PUBLIC_*` vars get inlined into the browser bundle at build time, so these must be correct in whatever environment runs the build, not just set on the dashboard for runtime.

## Full variable audit table

Ground truth = every `getEnv("X", ...)` call in `src/`, plus the build-time reads above. Cross-checked against `.env.example`, `.env`, `.dev.vars` (presence only — I did not read or record any secret values).

| Variable | Read via | In `.env.example`? | In local `.env`? | In local `.dev.vars`? | Consumers |
|---|---|:-:|:-:|:-:|---|
| `NOTION_SECRET` | `getEnv` | ✅ | ✅ | ❌ | All Notion routes |
| `NOTION_DB_ID` | `getEnv` | ✅ | ✅ | ❌ | Events |
| `NOTION_SIGNATORIES_DB_ID` | `getEnv` | ✅ | ✅ | ❌ | E4P pledge/signatories |
| `NOTION_FAQ_DB_ID` | `getEnv` | ✅ | ✅ | ❌ | FAQ |
| `NOTION_IDEAS_DB_ID` | `getEnv` | ✅ | ✅ | ❌ | Ideas |
| `NOTION_AGENDA_DB_ID` | `getEnv` | ✅ | ✅ | ❌ | Agenda/speakers |
| `NOTION_ENDORSEMENTS_DB_ID` | `getEnv` | ✅ | ✅ | ❌ | Endorsement requests |
| `NOTION_SPEAKERS_DB_ID` | — | ✅ | ✅ | ❌ | **Not read anywhere in code** — see [NOTION.md](NOTION.md) |
| `PROJECTHUB_API_KEY` | `getEnv` | ✅ | ❌ | ✅ | `/api/projects` |
| `PUBLIC_API_URL` | `getEnv` | ❌ **missing** | ❌ | ❌ | `/api/project-proxy` — always 503 locally without it |
| `PUBLIC_SECRET_KEY` | `getEnv` | ❌ **missing** | ❌ | ❌ | `/api/project-proxy` — always 503 locally without it |
| `HUB_API_URL` | `getEnv` | ✅ | ❌ | ✅ | `/api/membership-complete` |
| `HUB_API_KEY` | `getEnv` | ✅ | ❌ | ✅ | `/api/membership-complete` |
| `EO_API_KEY` | `getEnv` | ✅ | ❌ | ❌ | `/api/donation-complete`, `/api/membership-complete` |
| `PLAUSIBLE_API_KEY` | `getEnv` | ✅ | ❌ | ✅ | `/api/admin/conversion-stats` |
| `ADMIN_USERNAME` | `getEnv` | ❌ **missing** | ✅ | ✅ | Basic Auth for `/admin/conversions` |
| `ADMIN_PASSWORD` | `getEnv` | ❌ **missing** | ✅ | ✅ | Basic Auth for `/admin/conversions` |
| `SENTRY_WEBHOOK_SECRET` | `getEnv` | ✅ | ❌ | ⚠️ **typo** | `/api/sentry-webhook` — see gap below |
| `MATTERMOST_URL` | `getEnv` | ✅ | ❌ | ❌ | `/api/sentry-webhook` |
| `MATTERMOST_BOT_TOKEN` | `getEnv` | ✅ | ❌ | ❌ | `/api/sentry-webhook` |
| `MATTERMOST_CHANNEL_ID` | `getEnv` | ✅ | ❌ | ❌ | `/api/sentry-webhook` |
| `MEMBERSHIP_LIVE` | `getEnv` | ❌ **missing** | ❌ | ❌ | Feature flag on every `-new` page — always `false` locally |
| `SENTRY_DSN` | `process.env` (build/server) | ✅ | ✅ | ✅ | `sentry.server.config.js` |
| `SENTRY_ENVIRONMENT` | `process.env` | ✅ | ✅ | ✅ | `sentry.server.config.js` |
| `PUBLIC_SENTRY_DSN` | `import.meta.env` | ✅ | ✅ | ✅ | `sentry.client.config.js` (bundled into browser JS) |
| `PUBLIC_SENTRY_ENVIRONMENT` | `import.meta.env` | ✅ | ✅ | ✅ | `sentry.client.config.js` (bundled into browser JS) |
| `SENTRY_AUTH_TOKEN` | `process.env` (build only) | ✅ | ✅ | ✅ | `astro.config.mjs`, source-map upload during `pnpm build` |

## Gaps found in this audit (2026-07-11)

1. **`.dev.vars` has a typo**: `SENTRT_WEBHOOK_SECRET` instead of `SENTRY_WEBHOOK_SECRET`. `getEnv("SENTRY_WEBHOOK_SECRET", ...)` will return `undefined` locally, so `/api/sentry-webhook` always responds "Not configured" in dev regardless of the real secret being present. Fix: rename the key in your local `.dev.vars` (not a tracked file — I didn't edit it without confirming with you first).
2. **`PUBLIC_API_URL` / `PUBLIC_SECRET_KEY` aren't in `.env.example`, `.env`, or `.dev.vars`** anywhere locally, despite being required by `/api/project-proxy` (used by the volunteer/incubator forms). Locally that route always 503s. Worth adding to `.env.example` at minimum.
3. **`ADMIN_USERNAME` / `ADMIN_PASSWORD` aren't in `.env.example`** even though they're required and are present in your local `.env`/`.dev.vars`. Should be added to the template.
4. **`MEMBERSHIP_LIVE` isn't documented anywhere** — it's a plain feature-flag string (`"true"`/anything else), not a secret, but it's read via `getEnv()` on every `-new` page and has zero record in any env file or doc prior to this audit.
5. **The `.env` vs `.dev.vars` split has no clear rule.** Notion + Sentry + Admin vars are split across both files inconsistently (see table); nothing enforces which file a given var "should" go in. The comment in `wrangler.toml` ("Notion DB IDs are set via Cloudflare Pages dashboard... For local dev, add them to `.env`") only documents the Notion vars' convention, not the others.

## Recommendation going forward

Put **everything** in `.dev.vars` for local dev, since it's the only file that accurately simulates production's `locals.runtime.env` resolution path — and it's the tier `getEnv()` checks first, so it always wins if a value drifts between files. Keep `.env` only if something genuinely needs to be visible at Vite build time in dev (rare — check the "build-time-only" list above first). Keep `.env.example` as the single template covering the full var list from the table above, including the four currently missing.

## Auditing the Cloudflare Pages dashboard itself

I can't read your Cloudflare dashboard from here. To check what's actually configured there (Production and Preview environments are separate — check both):

**Via the dashboard UI:** Pages project → Settings → Environment variables.

**Via Wrangler CLI** (lists variable *names* only, not values — safe to run and share output):

```bash
npx wrangler pages secret list --project-name=website
```

(Project name `website` comes from `wrangler.toml`'s `name` field.) Run this against both environments if the CLI prompts for one, and diff the name list against the "Consumers" table above — anything in the table without a matching secret in the dashboard will fail in production the same way it fails locally.
