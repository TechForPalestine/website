---
title: "The ProjectHub Directory Feature"
summary: "A server-side proxy at /api/projects fetches and sanitizes the incubator project list from the external ProjectHub service, feeding a client-side search/filter/drawer UI in ProjectsDirectory.tsx."
topics: [architecture, integrations, projecthub]
sources:
  - id: projects-route
    type: file
    path: src/pages/api/projects.ts
  - id: projects-directory
    type: file
    path: src/components/projects/ProjectsDirectory.tsx
  - id: project-data
    type: file
    path: src/components/projects/projectData.ts
  - id: project-card
    type: file
    path: src/components/projects/ProjectCard.tsx
  - id: project-drawer
    type: file
    path: src/components/projects/ProjectDrawer.tsx
  - id: projects-new-page
    type: file
    path: src/pages/projects-new.astro
  - id: projects-doc
    type: file
    path: docs/PROJECTS.md
---

The T4P incubator's project directory is not local content — it is live data fetched from ProjectHub, an external T4P-run service at `projecthub.techforpalestine.org` [@projects-doc]. `src/pages/api/projects.ts` is the server-side proxy that fetches it with an API key the browser never sees, and `src/components/projects/ProjectsDirectory.tsx` is the client feature — search, tag filtering, and a project-detail drawer — that renders the result. The two halves exist because ProjectHub's public endpoint requires a key and can cold-start slowly, and because raw upstream data cannot be trusted to be safe to drop straight into `href` attributes.

## The proxy: retry, shape normalization, sanitization

`GET /api/projects` calls `https://projecthub.techforpalestine.org/api/public/projects` with an `X-API-Key` header built from `PROJECTHUB_API_KEY` via `getEnv` [@projects-route]. The call goes through a `fetchWithRetry` helper that retries up to twice with exponential backoff (500ms, then 1000ms) — but only on a 5xx response or a network error; any 4xx is returned immediately without a retry [@projects-route]. This exists specifically to absorb ProjectHub cold starts: a serverless backend that briefly 500s while it wakes up looks the same to a caller as a real outage, and a couple of short retries turns that into a transparent, slightly slower response instead of a visible directory failure.

ProjectHub's response shape isn't pinned to one contract from the route's point of view — the handler accepts a bare array, `{ data: [...] }`, or `{ projects: [...] }` and normalizes whichever one arrives into a single `{ projects, tags }` shape before sanitizing and returning it [@projects-route].

Every project object is passed through `sanitizeProjectUrls`, which walks a fixed list of roughly seventeen URL-shaped fields — website, logo, each social platform, leader photo, donation and involvement links — and replaces any value that isn't backed by a real `http:`/`https:`-parseable URL string with `undefined` [@projects-route]. The check itself lives in `sanitizeUrl` in `projectData.ts`, shared with the Notion client's own URL sanitization: it parses the string against a placeholder base and only accepts `http:`/`https:` protocols [@project-data]. The guard matters because ProjectHub is a separate, T4P-run but still external system — if it ever returned or was tricked into returning a `javascript:` URL in a field the frontend renders as a link, that would be a straightforward XSS vector. Sanitizing server-side means the browser never even receives the unsafe value.

The route returns aggressive no-cache headers (`no-cache, no-store, must-revalidate, max-age=0, s-maxage=0` plus several Cloudflare-specific anti-caching headers) and `Access-Control-Allow-Origin: *`, which is acceptable here specifically because the data is public and the route is read-only — there is no write path or secret being exposed by allowing any origin to read it [@projects-route]. That is a deliberate exception to the site's default of not putting a wildcard CORS header on endpoints that write or return anything sensitive; see [The security hardening baseline](security-hardening-baseline).

## The client: search, filter, featured band, drawer

`ProjectsDirectory.tsx` renders `/projects-new`'s directory. It only fetches `/api/projects` client-side on mount if it was not handed an `initialProjects` prop already — and `projects-new.astro` does hand it one: the page fetches ProjectHub directly during SSR, running its own inline copy of the same URL-field sanitization, before passing `initialProjects`/`initialTags` into the component with `client:load` [@projects-new-page]. That makes the client fetch inside `ProjectsDirectory.tsx` a fallback path for whenever the SSR fetch didn't happen or didn't run — the same "start empty, let the client fill in" pattern used elsewhere on the site for Notion-backed data.

Search input is debounced 250ms before it's applied, and matching runs across name, description, elevator pitch, and impact statement text; tag filtering is an intersection check against a project's own tags [@projects-directory]. When the visitor isn't actively searching or filtering, projects flagged `featured` are pulled out into their own band above the main grid; the moment a search or tag filter is active, that band disappears and featured projects fold back into the filtered results like everything else [@projects-directory]. Selecting a card opens `ProjectDrawer.tsx`, a focus-trapped modal that restores focus to the triggering card button on close and freezes the page's smooth-scroll instance while open [@project-drawer].

`ProjectCard.tsx` and `ProjectDrawer.tsx` both render a project's logo through `resolveLogoSrc`, which prefixes any `/`-rooted relative path with ProjectHub's origin so a logo stored as a relative upload path resolves correctly on the T4P site [@project-data]. If a logo is missing or fails to load, both components fall back to a rotated initials avatar built from `getInitials(name)` rather than a broken image [@project-card] [@project-drawer]. The drawer separately re-sanitizes the leader photo, website, donation, and involvement URLs at render time and validates the public contact email with `sanitizeEmail` before turning it into a `mailto:` link — the same defense-in-depth pattern as the server-side proxy, applied again on data that already passed through it [@project-drawer] [@project-data].

## Not the same thing as `project-proxy`

`/api/projects` is easy to confuse with `/api/project-proxy`, which sits in the same `src/pages/api/` directory but solves an unrelated problem: it is a generic, authenticated passthrough for the volunteer and incubator *application forms*, not the public project directory [@projects-doc]. `/api/projects` is public, unauthenticated, and read-only; `project-proxy` requires a secret key it injects server-side and only forwards a narrow set of upstream API paths. See [The generic form proxy and shared form infrastructure](generic-form-proxy) for that route's own path-normalization and header-allowlist pattern, and [API route conventions](api-route-conventions) for the shared shape both routes still follow (`prerender = false`, `getEnv`, generic error responses).
