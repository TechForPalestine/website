# Projects (ProjectHub Integration)

The `/projects` and `/projects-new` pages show the T4P incubator's project directory. Data comes live from **ProjectHub**, an external T4P-run service (`projecthub.techforpalestine.org`) — not from a local content collection. (An earlier plan considered migrating from markdown-based content collections to ProjectHub; that migration has already shipped as described below.)

## Architecture

```
projecthub.techforpalestine.org/api/public/projects
        │  server-side fetch, X-API-Key header
        ▼
   src/pages/api/projects.ts  (GET, public, sanitizes + retries)
        │
        ├──▶ ProjectsDirectory.tsx  (projects.astro — current directory UI)
        └──▶ ProjectsNew.tsx        (projects-new.astro, incubator sections — redesign variant)
```

## `/api/projects.ts`

- Calls ProjectHub's public endpoint server-side with `X-API-Key: PROJECTHUB_API_KEY`, so the key never reaches the browser.
- Retries up to twice on 5xx responses (exponential backoff, 500ms/1000ms) to absorb ProjectHub cold starts.
- Accepts either a bare array, `{ data: [...] }`, or `{ projects: [...] }` response shape from upstream.
- Runs `sanitizeProjectUrls()` on every project: any of ~16 known URL fields (`websiteUrl`, `logoUrl`, social links, `donationUrl`, etc.) that don't parse as `http:`/`https:` are stripped — guards against `javascript:`/`data:` URI XSS if ProjectHub ever returned attacker-controlled data.
- Response is explicitly `Cache-Control: no-cache, no-store, must-revalidate` with several Cloudflare-specific anti-caching headers, and CORS `Access-Control-Allow-Origin: *` (read-only public data, allowed per [SECURITY.md](SECURITY.md)).

## Frontend components

- **`src/components/projects/ProjectsDirectory.tsx`** — current `/projects` page: search (debounced), tag filtering, `ProjectCard`/`ProjectDrawer` detail view. Fetches client-side via `fetch("/api/projects")`.
- **`src/components/ProjectsNew.tsx`** — used by both `projects-new.astro` (standalone, sitemap-excluded — see [ARCHITECTURE.md](ARCHITECTURE.md#the--new-duplicate-page-pattern)) and `home-new.astro`'s incubator section. Same `/api/projects` fetch pattern.
- **`src/components/ProjectLogo.tsx`** — shared logo rendering with fallback.

## Not to confuse with `/api/project-proxy`

`src/pages/api/project-proxy.ts` is a **separate, generic authenticated proxy** (`PUBLIC_API_URL`/`PUBLIC_SECRET_KEY`) used only by the volunteer/incubator **application forms** (`src/store/api.ts` → `volunteerForm.tsx`, `inputs-mapping.tsx`). It has nothing to do with fetching the public project directory — see [API.md](API.md) for its security pattern (path normalization + header allowlist).

## Env vars

`PROJECTHUB_API_KEY` (for `/api/projects`), `PUBLIC_API_URL` + `PUBLIC_SECRET_KEY` (for the unrelated `project-proxy` form-submission path).
