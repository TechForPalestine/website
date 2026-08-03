---
title: "The Notion Client Layer"
summary: "src/store/notionClient.ts is the site's single gateway to the Notion API — seven exported fetch functions built on a fresh, uncached axios instance per call."
topics: [architecture, notion, integrations]
sources:
  - id: notion-client
    type: file
    path: src/store/notionClient.ts
  - id: events-route
    type: file
    path: src/pages/api/events.ts
  - id: faq-route
    type: file
    path: src/pages/api/faq.ts
  - id: ideas-route
    type: file
    path: src/pages/api/ideas.ts
  - id: speakers-route
    type: file
    path: src/pages/api/speakers.ts
  - id: events-doc
    type: file
    path: docs/EVENTS.md
  - id: events-legacy
    type: file
    path: src/components/Events.tsx
  - id: events-new
    type: file
    path: src/components/events/EventsNew.tsx
---

Every page on the site that shows Notion-authored content — events, FAQ, incubator ideas, agenda speakers, the E4P signatory wall, community calls — goes through one file: `src/store/notionClient.ts`. It exports seven functions, each building its own throwaway `axios` instance and issuing one or two direct calls to `https://api.notion.com/v1/` [@notion-client]. There is no shared client instance, no request cache, and no revalidation window anywhere in the file: every call to one of these functions is a live round trip to Notion at the moment it runs.

## Shape of the client

`createNotionAxios(secret)` builds a fresh axios instance per call, pinned to `Notion-Version: 2022-06-28` and authorized with a `Bearer` token read from an environment variable [@notion-client]. Nothing memoizes this instance across invocations — each exported function calls `createNotionAxios` itself, reads its own pair of environment variables (a shared `NOTION_SECRET` plus a database-specific ID like `NOTION_DB_ID` or `NOTION_FAQ_DB_ID`), and throws if either is missing. Because the client has no cache, the absence of caching has to be handled by whatever calls it — see the "no polling" section below.

A handful of small helpers do the actual property mapping: `titleText` and `richText` pull the first plain-text run out of a Notion `title`/`rich_text` property, and `fileUrl` reads the first attachment out of a `files` property, falling back to `/images/default.jpg` when a page has no header image at all [@notion-client]. Every one of the fetch functions below reuses these helpers instead of parsing Notion's page-property JSON shape from scratch.

## The seven fetch functions

Each function below targets a distinct Notion database, identified by its own environment variable; see [Notion databases](notion-databases) for the exact list of database IDs, key properties, and one unused ID this file never reads.

- **`fetchNotionEvents(showAll, locals)`** queries `NOTION_DB_ID`, filtering out rows where the `Visibility` checkbox is unchecked unless `showAll` is `true`, then sorts the results descending by `Date of event` [@notion-client]. `showAll` is how `/api/events?showAll=yes` exposes unpublished rows for previewing.
- **`fetchNotionEventById(pageId, locals)`** fetches a single event page directly by Notion page ID, used by the event-detail route [@notion-client] [@events-doc].
- **`fetchNotionFAQ(showAll, locals)`** queries `NOTION_FAQ_DB_ID` with the same `Visibility`/`showAll` pattern, then sorts ascending by a `Position` number property, defaulting missing positions to `999999` so unranked questions sink to the bottom rather than jumping to the top [@notion-client].
- **`fetchNotionIdeas(locals)`** queries `NOTION_IDEAS_DB_ID` and asks Notion itself to sort by `Name` ascending — the only fetch function that delegates sorting to the Notion query instead of doing it in JavaScript afterward [@notion-client].
- **`fetchNotionAgenda(locals)`** queries `NOTION_AGENDA_DB_ID`, then does something the other functions don't: it collects every unique page ID referenced by each row's `Moderator` relation property into a `Set`, fetches all of those moderator/speaker pages in parallel with `Promise.all`, and builds a `Map` from page ID to a flattened `{ name, title, bio, photo }` object. Each agenda item is then attached to its first moderator via that map, and the function returns `{ agendaItems, speakers }` — a list of talks plus a deduplicated, alphabetically sorted speaker roster derived from the same relation data [@notion-client]. `src/pages/api/speakers.ts` is the route that calls this function; despite its name, the route has nothing agenda-specific about it in isolation — it is really the agenda-with-resolved-speakers endpoint, and the `/api/speakers` name only makes sense once you know the response also carries `agendaItems` [@speakers-route].
- **`fetchE4PSignatories(locals)`** queries `NOTION_SIGNATORIES_DB_ID`, filtering to rows where `Approved` is checked, sorted ascending by `Signed At` [@notion-client].
- **`fetchCommunityCalls(locals)`** queries `NOTION_COMMUNITY_CALLS_DB_ID`, filtered by `Visibility`, and is the most involved function in the file — see below.

## Resolving Notion's split date/time-zone representation

`fetchCommunityCalls` has to answer "when does this call start, in UTC?" precisely, because the community call page uses that instant to compute a live/upcoming/past state client-side. Notion's `date` property does not always make this easy: when a date has no explicit time-zone override, the UTC offset is embedded directly in the `start` string (`"2026-07-22T17:00:00.000-04:00"`), and `Date.parse` handles it correctly. But when an editor sets an explicit time zone on the property, Notion strips the offset from `start` entirely and reports the zone name separately in `time_zone` — parsing the bare `start` string with `new Date()` at that point would apply the *server's* zone, not the intended one, silently corrupting the time for every visitor outside that zone [@notion-client].

`resolveDateToUtcIso` handles this by an offset-discovery trick: it takes the wall-clock time in `start`, treats it as if it were already UTC to get a guess instant, asks `Intl.DateTimeFormat` what wall-clock time that guess instant shows in the target `time_zone`, and corrects the guess by the difference between the two [@notion-client]. Rows with a date-only value (no `T` time component) or a `time_zone` that `Intl.DateTimeFormat` rejects are dropped from the result rather than defaulting to midnight UTC, because a community call with no reliable start time can't safely anchor a live-window calculation.

The function also reuses `sanitizeUrl` — the same `http:`/`https:`-only allowlist built for the ProjectHub integration — on every YouTube/LinkedIn/X URL property it reads, stripping anything that doesn't parse as a safe scheme [@notion-client]. This is defense in depth: a Notion database editor's pasted link becomes attacker-controlled input the moment it's rendered as an `href` on the public site.

## Consumers and the consequences of having no cache

`src/pages/api/events.ts`, `src/pages/api/faq.ts`, `src/pages/api/ideas.ts`, and `src/pages/api/speakers.ts` are thin `GET` wrappers: each one calls its corresponding `fetchNotion*` function and serializes the result, with `no-cache, no-store, must-revalidate` response headers [@events-route] [@faq-route] [@ideas-route] [@speakers-route]. Because `notionClient.ts` has no cache of its own, every hit to one of these routes is a fresh Notion API round trip — there's no shared in-memory or edge cache absorbing repeated requests.

On the client, both the legacy `Events.tsx` and the current `EventsNew.tsx` fetch once on mount and never poll: `EventsNew.tsx`'s effect runs once with an empty dependency array, and skips fetching entirely if SSR already provided `initialEvents` and the page isn't in `showAll` mode [@events-new]. The older `Events.tsx` component is the only one with a manual "Refresh" button; `EventsNew.tsx` has none, so once its initial data loads there is no way to see newly published events short of a full page reload [@events-legacy] [@events-doc]. Both components fall back to `/images/default.jpg` via an `onError` handler on the event image, which matters because Notion-hosted image URLs are signed and expire roughly an hour after being issued — a page left open, or a stale SSR response, can show a broken image until the fallback fires or the page is reloaded to fetch fresh URLs from Notion [@events-doc].

This whole layer is the runtime half of Notion as a headless CMS for the site; see [Notion as a data source](notion-as-data-source) for the editorial and schema side of the same integration. The `fetchCommunityCalls` timezone logic specifically backs the live-detection window described in [The community-call feature](community-call-feature).
