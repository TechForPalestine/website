---
title: "Notion as the Site's Data Source"
summary: "Notion functions as the T4P website's headless CMS for events, FAQ, ideas, agenda, and community-call content, accessed through two different integration patterns with a shared Visibility/showAll filtering convention."
topics: [architecture, data, integrations]
sources:
  - id: notion-client
    type: file
    path: src/store/notionClient.ts
  - id: notion-docs
    type: file
    path: docs/NOTION.md
  - id: e4p-signatories
    type: file
    path: src/pages/api/e4p-signatories.ts
  - id: endorsement-request
    type: file
    path: src/pages/api/endorsement-request.ts
---

Notion is the closest thing the T4P website has to a headless CMS: eight separate Notion databases back events, FAQ entries, project ideas, the London Gathering agenda, E4P signatories, endorsement requests, and community calls, each read or written through a per-database env var and a dedicated fetcher [@notion-docs]. There is no local content collection standing in for this data — `src/content/config.ts` defines an empty set of collections — so a page that needs any of this content has no choice but to talk to Notion on every request. That makes the shape of the Notion integration, not a database schema, the thing worth understanding when tracing where a piece of content on the site actually comes from.

## Two integration patterns, not one

The repo reaches Notion's API in two distinct ways, and the choice between them tracks a specific distinction: read-heavy public traffic versus one-off writes.

The first pattern is `src/store/notionClient.ts`, a single file exporting `fetchNotionEvents`, `fetchNotionEventById`, `fetchNotionFAQ`, `fetchNotionIdeas`, `fetchNotionAgenda`, `fetchE4PSignatories`, and `fetchCommunityCalls`. Every one of these functions builds its own `axios` instance from scratch via a local `createNotionAxios(secret)` helper, setting the `Authorization: Bearer` header and `Notion-Version` manually rather than using Notion's official client [@notion-client]. There is no caching layer anywhere in this file — each call is a live HTTP round-trip to `api.notion.com`, meaning content edited in Notion is visible on the site on the very next request, at the cost of every page load depending on Notion's API being up and fast.

The second pattern is the official `@notionhq/client` SDK, used directly inside `src/pages/api/e4p-signatories.ts` and `src/pages/api/endorsement-request.ts` rather than going through `notionClient.ts` [@e4p-signatories] [@endorsement-request]. Both routes instantiate their own `Client({ auth: notionSecret })` inline. `e4p-signatories.ts` is a simple filtered read — it queries the signatories database for rows where `Approved` is checked and maps the results into a plain JSON array [@e4p-signatories]. `endorsement-request.ts` is a write: after validating an incoming POST body (required fields, email format, URL format, a 2000-character cap per field), it calls `notion.pages.create(...)` to insert a new row into the endorsements database [@endorsement-request]. `docs/NOTION.md` states the intended split plainly: pattern one is for high-traffic reads, pattern two is for one-off writes, and any new Notion-backed feature should default to whichever pattern matches its access shape [@notion-docs].

## The Visibility checkbox and showAll convention

Most of the content databases carry a `Visibility` checkbox property, and the fetchers that read them build their Notion query filter around it. `fetchNotionEvents` and `fetchNotionFAQ` both take a `showAll` boolean parameter: when false (the default), the query filter restricts results to rows where `Visibility` equals `true`; when true, the filter is dropped entirely and every row in the database comes back, including unpublished drafts [@notion-client]. `docs/NOTION.md` documents that `showAll=yes` is meant to be passed as a query parameter by admin or preview tooling, not exposed to the public pages [@notion-docs]. This means a content editor can stage a new event or FAQ entry in Notion with `Visibility` unchecked, see it via the `showAll` override, and only flip it live for the general public by ticking the checkbox — no deploy required either way, since the filter is evaluated on every live request.

`fetchCommunityCalls` follows the same `Visibility`-checkbox filter but without a `showAll` escape hatch — it always filters to visible rows [@notion-client]. `fetchNotionIdeas` and `fetchNotionAgenda` skip the convention entirely and query their databases unfiltered, since those datasets don't need a public/draft split [@notion-client].

## Property names are a silent coupling point

Every fetcher reads Notion properties by their exact display-name string — `props["Date of event"]`, `props["Link to registration"]`, `props["Moderator"]` — because that is how Notion's API exposes column values in its JSON response [@notion-client]. This creates a coupling that nothing in the code enforces: renaming a column in the Notion UI does not raise an error anywhere in this pipeline. The property lookup simply returns `undefined`, the helper functions (`titleText`, `richText`, `fileUrl`) fall back to an empty string or a default image, and the field quietly goes blank on the live site [@notion-client] [@notion-docs]. There is no schema validation step between Notion and the rendered page that would catch this before a visitor does.

## A configured but unread database

`docs/NOTION.md` also flags `NOTION_SPEAKERS_DB_ID` as a database ID that is still configured in `.env.example` and `DEPLOYMENT.md` but is not read by any current fetcher — agenda and speaker data is resolved instead through the `Moderator` relation property inside the Agenda database itself, via `fetchNotionAgenda`'s speaker-resolution step [@notion-client] [@notion-docs]. It is a dead environment variable: present in configuration, invisible in behavior, and a reminder that an env var existing in `.env.example` is not proof that any code path depends on it. See [environment variable resolution](environment-variable-resolution) for how `getEnv()` looks up every one of the `NOTION_*` secrets these fetchers depend on.
