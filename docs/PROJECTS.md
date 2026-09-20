# Projects (ProjectHub Integration)

The `/projects` page shows the T4P incubator's project directory. Data comes live from **ProjectHub**, an external T4P-run service (`projecthub.techforpalestine.org`) — not from a local content collection. (An earlier plan considered migrating from markdown-based content collections to ProjectHub; that migration has already shipped as described below.)

## Architecture

```
projecthub.techforpalestine.org/api/public/projects
        │  server-side fetch, X-API-Key header
        ▼
   src/store/projectsClient.ts  (fetchProjectsData: retries, sanitizes URL fields)
        │
        ├──▶ src/pages/api/projects.ts       (GET, public — the island's data)
        │        └──▶ ProjectsNew.tsx        (the live directory, despite the name)
        │
        └──▶ src/pages/projects/[...slug].astro  (resolves a shared link's preview)
```

`/projects` and `/projects/<slug>` both render `src/components/projects/ProjectsPage.astro`; only the `<head>` differs.

## `src/store/projectsClient.ts` and `/api/projects.ts`

`fetchProjectsData(locals)` holds the ProjectHub logic; `/api/projects` is a thin wrapper that adds the response headers and error reporting.

- Calls ProjectHub's public endpoint server-side with `X-API-Key: PROJECTHUB_API_KEY`, so the key never reaches the browser.
- Retries up to twice on 5xx responses (exponential backoff, 500ms/1000ms) to absorb ProjectHub cold starts.
- Accepts either a bare array, `{ data: [...] }`, or `{ projects: [...] }` response shape from upstream.
- Runs `sanitizeProjectUrls()` on every project: any of ~16 known URL fields (`websiteUrl`, `logoUrl`, social links, `donationUrl`, etc.) that don't parse as `http:`/`https:` are stripped — guards against `javascript:`/`data:` URI XSS if ProjectHub ever returned attacker-controlled data.
- The response is `Cache-Control: no-store` (the middleware forces this on all of `/api/*`) with CORS `Access-Control-Allow-Origin: *` (read-only public data, allowed per [SECURITY.md](SECURITY.md)). The server-side cache below is what avoids ProjectHub calls, not browser caching.
- An `X-Projects-Source: hit|miss|stale` header says where the list came from, which is how to check the cache is working.

## Shareable project URLs

Every project has a URL: `/projects/<name-slug>-<id>`, for example `/projects/hasbara-hub-42`. It renders the directory with that project's dialog open.

- **The id identifies the project; the name part is cosmetic.** `src/utils/projectSlug.ts` matches on the trailing id only, so a renamed project's old links still resolve and 301 to the current slug. (`eventSlug.ts` requires an exact match, so an event rename would break its links.) An empty or non-Latin name falls back to `project-<id>`.
- **Server** (`src/pages/projects/[...slug].astro`): fetches the list via `fetchProjectsData`, finds the project, and passes `projectMetaTags()` (`src/utils/projectMeta.ts`) to the page so a pasted link previews the project: its name, its pitch plus "Led by ...", and its logo. A logo is a small square, so those links use the `summary` Twitter card rather than `summary_large_image`; a project with no logo falls back to the T4P social image.
- **A ProjectHub failure does not redirect.** Only a genuine "no such project" redirects (302 to `/projects`). If the fetch itself fails, the page renders generically and the island resolves the project client-side, so an outage does not discard the visitor's link.
- **Client** (`ProjectsNew.tsx`): opens the matching dialog once data loads, `pushState`s on open and close, and follows `popstate` for back and forward. The dialog has a "Copy link" button that always copies the canonical URL.
- **Every project link makes the server resolve the full list**, which is why the list is cached (next section): without it, a slow ProjectHub would delay link previews.
- **Not in the sitemap.** `@astrojs/sitemap` only knows static routes, so the ~90 project URLs are not listed and Google has to discover them by other means. A dynamic sitemap endpoint was built and then removed on purpose; see the git history (`71979e1`) if it is wanted again.

## Caching

`fetchProjectsData` (`src/store/projectsClient.ts`) caches the parsed, sanitized list in the Workers Cache API. The decision logic is in `src/utils/projectsCachePolicy.ts`, free of any Cloudflare dependency.

- **Fresh for 5 minutes.** A ProjectHub edit shows on the site within about that long.
- **Stale-if-error for 24 hours.** If ProjectHub is down or fails, the last good copy is served (`X-Projects-Source: stale`). It throws only when there is no usable copy.
- **The key is a synthetic request, never the outbound one**, so the `X-API-Key` header cannot end up in a cache entry. The key carries a version (`?v=1`): entries hold already-sanitized data, so **bump it whenever `sanitizeProjectUrls` changes**.
- **An empty list is never cached** and never replaces a good entry: the unexpected-shape branch returns `[]`, and that is not evidence that every project vanished.
- **A broken cache never breaks the page.** A failed read is a miss; a failed write is ignored.
- **Only works on a custom domain.** The Cache API is absent in `astro dev`, Node, and on `*.pages.dev` previews; there it falls back to fetching every time. It is also per-datacenter, so each datacenter pays one uncached fetch after expiry.
- Not done on purpose: sharing an in-flight promise between requests in one isolate. Workers forbid awaiting I/O started by a different request.

## Frontend components

- **`src/components/ProjectsNew.tsx`** — the live `/projects` directory: state, search and tag filtering, deep-link handling. The name is a leftover from the abandoned redesign (see [ARCHITECTURE.md](ARCHITECTURE.md#the-abandoned--new-redesign)); the component itself is reachable and shipping. Fetches client-side via `/api/projects`.
- **`src/components/projects/DirectoryCards.tsx`** — the memoized featured and grid cards. Transient state (a failed image, a copied email) is local to each card so it re-renders one card, not the directory.
- **`src/components/projects/ProjectDetailsDialog.tsx`** — the detail dialog, loaded on demand and preloaded when the browser is idle.
- **`src/components/projects/directoryShared.tsx`** — types, helpers and the `useCopyText` hook shared by the three above.
- **`ProjectsDirectory.tsx`, `ProjectDrawer.tsx`, `ProjectCard.tsx`** in the same folder are **not reachable from any live page**; the older directory implementation. Do not edit them expecting a change on the site.
- **`src/components/ProjectLogo.tsx`** — shared logo rendering with fallback.

## Not to confuse with `/api/project-proxy`

`src/pages/api/project-proxy.ts` is a **separate, generic authenticated proxy** (`PUBLIC_API_URL`/`PUBLIC_SECRET_KEY`) used only by the volunteer/incubator **application forms** (`src/store/api.ts` → `volunteerForm.tsx`, `inputs-mapping.tsx`). It has nothing to do with fetching the public project directory — see [API.md](API.md) for its security pattern (path normalization + header allowlist).

## Env vars

`PROJECTHUB_API_KEY` (for `/api/projects`), `PUBLIC_API_URL` + `PUBLIC_SECRET_KEY` (for the unrelated `project-proxy` form-submission path).
