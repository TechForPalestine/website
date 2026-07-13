# Notion Integration

Notion is the CMS for most semi-dynamic content on the site. There are **7 separate Notion databases**, each with its own env var and consuming route(s).

| Database                   | Env var (ID)                | Fetcher / route                                                                                                                                                                | Consumed by                                                                                                  |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Events                     | `NOTION_DB_ID`              | `fetchNotionEvents()` / `fetchNotionEventById()` in `src/store/notionClient.ts`; `/api/events`                                                                                 | `events.astro`, `Events.tsx` — full detail in [EVENTS.md](EVENTS.md)                                         |
| FAQ                        | `NOTION_FAQ_DB_ID`          | `fetchNotionFAQ()`; `/api/faq`                                                                                                                                                 | `faq.astro`                                                                                                  |
| Ideas                      | `NOTION_IDEAS_DB_ID`        | `fetchNotionIdeas()`; `/api/ideas`                                                                                                                                             | `ideas.astro`                                                                                                |
| Agenda / Speakers          | `NOTION_AGENDA_DB_ID`       | `fetchNotionAgenda()`; `/api/speakers`                                                                                                                                         | London Gathering agenda page — resolves `Moderator` relation properties against speaker pages in the same DB |
| E4P Signatories            | `NOTION_SIGNATORIES_DB_ID`  | `/api/e4p-signatories` (GET, reads only `Approved` rows), `/api/e4p-pledge-sign` (POST, creates unapproved rows) — both use `@notionhq/client` directly, not `notionClient.ts` | `e4p.astro`, `e4p/pledge.astro`, `e4p/sign-up.astro` — see [E4P.md](E4P.md)                                  |
| Endorsements               | `NOTION_ENDORSEMENTS_DB_ID` | `/api/endorsement-request` (POST, `@notionhq/client` directly)                                                                                                                 | `endorsements.astro`                                                                                         |
| _(unused by current code)_ | `NOTION_SPEAKERS_DB_ID`     | listed in `.env.example`/DEPLOYMENT.md but not referenced by any current fetcher — agenda/speaker data now comes from the Agenda DB's `Moderator` relation                     | —                                                                                                            |

## Two integration patterns in the codebase

1. **`src/store/notionClient.ts`** (axios, `Bearer` auth header built manually) — used for read-heavy, high-traffic routes: events, FAQ, ideas, agenda. All exported fetchers take `(…args, locals?)` and resolve credentials via `getEnv(name, locals)`.
2. **`@notionhq/client`** (official SDK) — used directly inside the signatories and endorsements routes, which are one-off writes (`notion.pages.create(...)`) plus a simple filtered read. These don't go through `notionClient.ts`.

New Notion-backed features should default to pattern 1 (`notionClient.ts`) for reads if there's meaningful traffic, and the official SDK for one-off writes — matching what's already there.

## Data shape quirks worth knowing

- Notion property names are matched by their exact display name in the database (`props["Date of event"]`, `props["Link to registration"]`, etc.) — renaming a property in Notion silently breaks the mapping (returns empty string, no error).
- Most fetchers default missing/optional fields to `""` rather than `null`/`undefined`, and events specifically fall back to `/images/default.jpg` when no header image is set.
- Events and FAQ both filter on a `Visibility` checkbox property by default; pass `showAll=yes` as a query param to bypass it (used by admin/preview tooling, not the public pages).
- **Notion-hosted image URLs expire after roughly 1 hour** (an Notion/AWS S3 signed-URL limitation). The Events page has no server-side proxy/cache for this anymore (see [EVENTS.md](EVENTS.md) — the Cloudflare Worker image proxy was removed in PR #415); the frontend just falls back to the default image on load error.

## Env vars

`NOTION_SECRET` (shared across all databases), plus one `NOTION_*_DB_ID` per database above. Full list in [DEPLOYMENT.md](../DEPLOYMENT.md).
