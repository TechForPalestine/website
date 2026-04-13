# Deployment

## Website

The site deploys automatically to Cloudflare Pages on push to `main`.

- Build command: `pnpm build`
- Output directory: `dist/`

## Environment Variables

Set the following in the Cloudflare Pages dashboard:

- `NOTION_SECRET` — Notion integration token
- `NOTION_DB_ID` — Events database ID
- `NOTION_SIGNATORIES_DB_ID`
- `NOTION_FAQ_DB_ID`
- `NOTION_IDEAS_DB_ID`
- `NOTION_SPEAKERS_DB_ID`
- `NOTION_AGENDA_DB_ID`
- `NOTION_ENDORSEMENTS_DB_ID`
- `PROJECTHUB_API_KEY`

For local development, copy `.env.example` to `.env` and fill in values.
