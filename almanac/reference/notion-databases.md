---
title: "Notion Databases Reference"
summary: "Exact lookup table of the eight Notion databases behind the site, their env vars, consuming code, and key properties, including the one env var no fetcher reads."
topics: [reference, notion, data]
sources:
  - id: notion-docs
    type: file
    path: docs/NOTION.md
  - id: notion-client
    type: file
    path: src/store/notionClient.ts
  - id: signatories-route
    type: file
    path: src/pages/api/e4p-signatories.ts
  - id: pledge-sign-route
    type: file
    path: src/pages/api/e4p-pledge-sign.ts
  - id: endorsement-route
    type: file
    path: src/pages/api/endorsement-request.ts
  - id: community-call-spec
    type: file
    path: docs/superpowers/specs/2026-07-15-community-call-design.md
  - id: env-example
    type: file
    path: .env.example
---

This page is the exact lookup table for the eight Notion databases the T4P website reads from or writes to, each identified by its own `NOTION_*_DB_ID` environment variable and a shared `NOTION_SECRET` [@notion-docs]. It lists which code touches each database and the exact Notion property names that code depends on, since a rename of any of these properties in the Notion UI silently breaks the mapping rather than raising an error — see [Notion as a data source](../concepts/notion-as-data-source) for that failure mode and [The Notion client layer](../architecture/integrations/notion-client) for how the fetchers in `src/store/notionClient.ts` are structured.

## Databases

| Database | Env var | Consuming code | Key properties |
| --- | --- | --- | --- |
| Events | `NOTION_DB_ID` | `fetchNotionEvents` / `fetchNotionEventById` in `notionClient.ts`; `/api/events` [@notion-client] | `Title`, `Date of event`, `Stage`, `Type of event`, `Header` (file), `Description`, `Link to registration`, `Link to recording`, `Visibility` [@notion-client] |
| FAQ | `NOTION_FAQ_DB_ID` | `fetchNotionFAQ`; `/api/faq` [@notion-client] | `Question`, `Answer`, `Position` (defaults to `999999` when unset), `Visibility` [@notion-client] |
| Ideas | `NOTION_IDEAS_DB_ID` | `fetchNotionIdeas`; `/api/ideas` [@notion-client] | `Name`, `Category`, `Description`; sorted `Name` ascending by the Notion query itself rather than in JavaScript [@notion-client] |
| Agenda / Speakers | `NOTION_AGENDA_DB_ID` | `fetchNotionAgenda`; `/api/speakers` [@notion-client] | `Title`, `Description`, `Time`, `Moderator` (relation, resolved against `Name`, `Title`, `Speaker bio`, `Photo` on the same database's rows) [@notion-client] |
| E4P Signatories | `NOTION_SIGNATORIES_DB_ID` | `GET /api/e4p-signatories` (reads `Approved` rows via `@notionhq/client`) [@signatories-route]; `POST /api/e4p-pledge-sign` (creates unapproved rows via `@notionhq/client`) [@pledge-sign-route] | `Name`, `Email`, `Company`, `Position`, `LinkedIn URL`, `Signed At`, `Approved` (checkbox — new pledge rows are written with `Approved: false`) [@signatories-route] [@pledge-sign-route] |
| Endorsements | `NOTION_ENDORSEMENTS_DB_ID` | `POST /api/endorsement-request` (`notion.pages.create`, `@notionhq/client`) [@endorsement-route] | `Contact Name`, `Contact Email`, `Org Name`, `Org Website`, `Campaign Name`, `Request`, plus additional rich-text fields for campaign purpose and notable supporters [@endorsement-route] |
| Community Calls | `NOTION_COMMUNITY_CALLS_DB_ID` | `fetchCommunityCalls` in `notionClient.ts`; `community-call.astro`, `community-call-old.astro`, `CommunityCallBanner.astro` [@notion-client] | `Title`, `Date` (must include a time — date-only rows are rejected), `Description`, `YouTube URL`, `YouTube Vertical URL`, `LinkedIn URL`, `X URL`, `Visibility` [@notion-client] [@community-call-spec] |
| _(unused)_ | `NOTION_SPEAKERS_DB_ID` | none — configured in `.env.example` but not read by any current fetcher [@env-example] [@notion-docs] | — |

## The `Visibility` convention

`Events`, `FAQ`, and `Community Calls` share a `Visibility` checkbox property that the corresponding fetch functions filter on by default [@notion-client]. `fetchNotionEvents` and `fetchNotionFAQ` both accept a `showAll` boolean that, when true, drops the `Visibility` filter entirely and returns every row including unpublished drafts [@notion-client]. `fetchCommunityCalls` filters on `Visibility` unconditionally, with no `showAll` override [@notion-client]. `Ideas` and `Agenda` query their databases unfiltered and have no `Visibility` property in this list.

## The unread database ID

`NOTION_SPEAKERS_DB_ID` is listed in `.env.example` and Cloudflare Pages deployment configuration, but no function in `notionClient.ts` or any API route reads it [@env-example] [@notion-docs]. Speaker data is resolved instead through the `Moderator` relation property on the Agenda database, inside `fetchNotionAgenda` itself [@notion-client]. The variable is configuration with no corresponding behavior.
