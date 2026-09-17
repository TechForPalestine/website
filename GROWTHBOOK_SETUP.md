# GrowthBook setup

- [x] Signed in (via `npx @growthbook/wizard`, run before this skill loaded)
- [x] Detected stack — Astro v5 SSR (`output: "server"`), Cloudflare Pages adapter, pnpm, TypeScript, React 19 islands mounted with `client:only="react"` (no single app entry point / `main.tsx`)
- [x] SDK connection created — `sdk_19g6dmu5h65r1` (dev environment)
- [x] Package installed — `@growthbook/growthbook-react@1.7.0` (pnpm)
- [x] Env var prefix fixed — wizard wrote `VITE_GROWTHBOOK_CLIENT_KEY`, but this is Astro, not plain Vite: Astro's `envPrefix` defaults to `PUBLIC_` only (confirmed in `node_modules/astro/dist/env/env-loader.js`), and `astro.config.mjs` doesn't override it. Renamed to `PUBLIC_GROWTHBOOK_CLIENT_KEY` in `.env.local` and `src/growthbook.ts`.
- [x] Plan approved — install-only, no flag/experiment created
- [x] Provider wired — reusable `src/components/GrowthBookProvider.tsx`, no global mount (no single entry point exists)
- [x] Connection confirmed (`gb-check --language react` — all 7 checks pass)
- [x] Run closed out — https://app.growthbook.io/auto-runs/arun_2Cf8yGvo7FCobWU1VnfzDo?org=org_19g6nmtu7vfbg

**Client key:** sdk-OJTy… (truncated; full value is in `.env.local`)
**Environment:** dev
**SDK connection:** https://app.growthbook.io/sdks/sdk_19g6dmu5h65r1?org=org_19g6nmtu7vfbg
**Scripts:** /home/magnus/.claude/skills/sdk-install/scripts
**Next step:** when there's something to flag, wrap that island in `<GrowthBookProvider>` from `src/components/GrowthBookProvider.tsx` and create the flag with `gb-flag`.

## Notes
- No single React entry point exists (Astro SSR + independent `client:only="react"` islands per page), so `src/components/GrowthBookProvider.tsx` is a reusable wrapper — wrap whichever specific island ends up reading a flag, not a global root.
- `enableDevMode: true` and no plugins (this SDK version has no `plugins` API) — matches what the wizard already wrote in `src/growthbook.ts`, apart from the env var name.
- Streaming is off (`streaming: false`) — flag payload fetches once on load; toggling a flag in GrowthBook takes effect on the next page load, not live.
