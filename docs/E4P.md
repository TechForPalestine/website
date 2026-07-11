# Entrepreneurs for Palestine (E4P)

E4P is a pledge/signatory campaign for entrepreneurs, separate from the main membership/donation flows.

## Pages

- **`e4p.astro`** — landing page, renders `E4PPage.jsx` (`client:only="react"`).
- **`e4p/sign-up.astro`** — Calendly scheduling embeds (region-specific: Americas / other), for booking an intro call.
- **`e4p/pledge.astro`** — the pledge form: name, email, company, position, LinkedIn URL, agreement checkbox. Submits client-side to `POST /api/e4p-pledge-sign`.
- **`e4p-new.astro`** — redesign variant, excluded from the sitemap (see [ARCHITECTURE.md](ARCHITECTURE.md#the--new-duplicate-page-pattern)).

## API routes

- **`POST /api/e4p-pledge-sign`** — validates `Origin: https://techforpalestine.org`, required fields, email format, LinkedIn URL format, and a 2000-char cap on free-text fields, then creates a page in the **Signatories** Notion database with `Approved: false`. New signatories are unapproved by default — a human moderates and flips `Approved` in Notion before they show up publicly.
- **`GET /api/e4p-signatories`** — public read, returns only rows where `Approved` is checked, sorted by `Signed At` ascending.

Both use `@notionhq/client` directly against `NOTION_SIGNATORIES_DB_ID` (not `src/store/notionClient.ts` — see [NOTION.md](NOTION.md) for why two patterns coexist).

## Env vars

`NOTION_SECRET`, `NOTION_SIGNATORIES_DB_ID`.
