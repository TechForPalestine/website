---
title: "Empty Content Collections"
summary: "Astro content collections in src/content/config.ts were emptied out as projects and ideas content moved to Notion and ProjectHub, leaving AGENTS.md's description of local markdown collections stale and code-contradicted."
topics: [decisions, content, notion, projecthub]
sources:
  - id: config
    type: file
    path: src/content/config.ts
  - id: architecture-doc
    type: file
    path: docs/ARCHITECTURE.md
  - id: agents-md
    type: file
    path: AGENTS.md
  - id: projects-api
    type: file
    path: src/pages/api/projects.ts
---

`src/content/config.ts` defines `export const collections = {};` — no schemas, no collections, nothing [@config]. Astro's content collections feature is present in the project only as an unused hook. The site used to keep `projects/` and `ideas/` as local markdown collections validated by Zod schemas in that file; both moved out of the repository entirely, `projects` to the external ProjectHub service and `ideas`/`events`/`FAQ` to Notion. `docs/ARCHITECTURE.md` documents the empty state as current [@architecture-doc], but `AGENTS.md` still describes the old setup, and the two files now disagree about a basic fact of where content lives.

## Context

Keeping project and idea listings as markdown files in `src/content/` meant every new project or idea required a commit and a deploy, and non-engineers editing that content needed either PR access or a manual hand-off to someone who had it. Both kinds of content have an owner who wants to publish independently of the codebase: incubator projects live in ProjectHub, a separate service at `projecthub.techforpalestine.org`, and events/FAQ/ideas live in Notion databases maintained by non-engineering staff — see [Notion as a data source](../concepts/notion-as-data-source) for the broader pattern this fits into.

Once content authoring moved to those external systems, the local collections had nothing left to hold. `docs/ARCHITECTURE.md` states this directly: "`src/content/config.ts` currently defines `collections = {}` — empty. Older documentation and some historical plans reference markdown-based `ideas/`/`projects/` content collections; that data now comes from Notion and ProjectHub respectively... Don't assume `src/content/` holds live data without checking the collections config first" [@architecture-doc].

## Decision

Projects and ideas content is not stored in the repository. `/api/projects` is a server-side proxy that calls ProjectHub's public API directly and sanitizes URL-shaped fields before returning them to the client [@projects-api] [@architecture-doc], and Notion-backed routes (`/api/ideas`, `/api/events`, `/api/faq`) pull from Notion databases through `src/store/notionClient.ts`. `src/content/` and its `config.ts` are kept in the tree as a placeholder — an empty `collections` export — rather than removed, so that any future collection that genuinely belongs in the repo (something authored by engineers, versioned with code) has a place to be added without re-introducing the whole content-collections wiring from scratch [@config].

## Status

Shipped and current. This is not a pending migration; it is the state of the file today, and `docs/ARCHITECTURE.md` was updated to describe it accurately [@config] [@architecture-doc].

`AGENTS.md`, however, was not updated to match. Its "Project Structure & Module Organization" section still reads: "`src/content/`: Content collections (`projects/`, `ideas/`) with Zod schemas in `config.ts`" [@agents-md]. That sentence describes a setup that no longer exists — there is no `projects/` or `ideas/` directory under `src/content/`, and `config.ts` has no schemas at all, Zod or otherwise [@config]. This is a real, verifiable conflict between two committed docs, not a stale-sounding turn of phrase: one file asserts local markdown collections exist, the other file (and the actual `config.ts`) shows they don't.

## Consequences

A maintainer who reads `AGENTS.md` first and goes looking for `src/content/projects/*.md` files to edit will not find them, because the projects listing now comes from a ProjectHub API call and the ideas listing from a Notion database query — neither is a file in this repository. Trust `docs/ARCHITECTURE.md` and the actual contents of `src/content/config.ts` over `AGENTS.md` on this specific point until someone corrects `AGENTS.md`'s Project Structure section.

Because `src/content/` still exists with a valid, empty `collections` export, adding a real content collection later is a matter of defining a schema in `config.ts` and dropping markdown files into a matching subdirectory — the integration point hasn't been removed, only left unused. Until that happens, any change to what projects or ideas content looks like has to go through ProjectHub or Notion, not through a pull request to this repository — see [the ProjectHub directory integration](../architecture/integrations/projecthub-directory) and [Notion as a data source](../concepts/notion-as-data-source) for how those two external sources are wired in.
