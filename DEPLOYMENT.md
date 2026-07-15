# Deployment

## Website

The site deploys automatically to Cloudflare Pages on push to `main`.

- Build command: `pnpm build`
- Output directory: `dist/`

## Environment Variables

Set the following in the Cloudflare Pages dashboard (Production and Preview are separate — set both). See `.env.example` for the canonical list; grouped here by subsystem (docs in parens). For how `.env`/`.dev.vars`/the dashboard interact locally, and a full audit of what's actually wired up, see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

**Notion** ([docs/NOTION.md](docs/NOTION.md))

- `NOTION_SECRET` — shared integration token
- `NOTION_DB_ID` — Events database ID
- `NOTION_SIGNATORIES_DB_ID`, `NOTION_FAQ_DB_ID`, `NOTION_IDEAS_DB_ID`, `NOTION_AGENDA_DB_ID`, `NOTION_ENDORSEMENTS_DB_ID`, `NOTION_COMMUNITY_CALLS_DB_ID`
- `NOTION_SPEAKERS_DB_ID` — listed for completeness; not currently read by any route

**ProjectHub / generic proxy** ([docs/PROJECTS.md](docs/PROJECTS.md))

- `PROJECTHUB_API_KEY` — for `/api/projects`
- `PUBLIC_API_URL`, `PUBLIC_SECRET_KEY` — for `/api/project-proxy` (volunteer/incubator forms)

**Donations & membership** ([docs/DONATIONS.md](docs/DONATIONS.md))

- `HUB_API_URL`, `HUB_API_KEY` — membership invite on completion
- `EO_API_KEY` — EmailOctopus donor/member sync
- `PLAUSIBLE_API_KEY` — Stats API for the admin conversion dashboard
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` — HTTP Basic Auth for `/admin/conversions`

**Sentry**

- `SENTRY_DSN`, `SENTRY_ENVIRONMENT` (server), `PUBLIC_SENTRY_DSN`, `PUBLIC_SENTRY_ENVIRONMENT` (client)
- `SENTRY_AUTH_TOKEN` — source map upload; must be set at **build** time, not just runtime
- `SENTRY_WEBHOOK_SECRET`, `MATTERMOST_URL`, `MATTERMOST_BOT_TOKEN`, `MATTERMOST_CHANNEL_ID` — Sentry → Mattermost alert relay (`/api/sentry-webhook`)

**Feature flags**

- `MEMBERSHIP_LIVE` — `"true"`/anything else; gates membership-related UI on every `-new` page

For local development, copy `.env.example` to `.env`, and see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for why most secrets should actually go in `.dev.vars` instead.
