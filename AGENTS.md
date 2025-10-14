# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/`: Astro routes (e.g., `index.astro`, `events.astro`); API routes in `src/pages/api/*.ts`.
- `src/components/`: UI islands (React `.tsx`, Svelte `.svelte`, Astro `.astro`).
- `src/layouts/`: Shared page layouts.
- `src/content/`: Content collections (`projects/`, `ideas/`) with Zod schemas in `config.ts`.
- `src/store/`: Clients and data utilities (e.g., Notion client).
- `src/styles/`: Tailwind entry (`base.css`).
- `public/`: Static assets. Build output goes to `dist/`.
- `cloudflare-worker/`: Worker that proxies Notion images (deployed separately via Wrangler).

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev` (alias `pnpm start`): Run Astro dev server at `http://localhost:4321`.
- `pnpm build`: Build static site to `dist/`.
- `pnpm preview`: Preview the production build locally.
- `pnpm dlx astro check` (or `pnpm astro -- check`): Type checking and diagnostics for Astro/TS.
- Worker: `cd cloudflare-worker && wrangler dev|deploy` (runs/deploys the image proxy).

## Coding Style & Naming Conventions
- **Languages**: Astro, TypeScript, React, Svelte, Tailwind.
- **Indentation**: 2 spaces. **Quotes**: double quotes. **Semicolons**: required.
- **Components**: PascalCase for React/Svelte files (e.g., `Events.tsx`, `NavBar.svelte`).
- **Routes**: Kebab-case for pages (e.g., `get-involved.astro`). API filenames are camelCase or kebab-case.
- **Tailwind**: Prefer utility-first; keep class lists readable and grouped by layout → spacing → color.
- Avoid verbose `console.log` in production paths.

## Testing Guidelines
- No test framework configured yet. When adding tests, prefer **Vitest** + **@testing-library**.
- Suggested structure: colocate tests as `*.test.ts(x)` or use `src/__tests__/`.
- Keep tests deterministic; mock network calls to Notion/ProjectHub.

## Commit & Pull Request Guidelines
- **Commits**: Small, scoped, imperative mood (e.g., `fix: handle expired Notion URLs`).
- **PRs**: Include a clear description, linked issues, and screenshots for UI changes. Note any schema/content updates.
- **Checks**: Run `pnpm build` and `npx astro check` locally before opening a PR.
- **Secrets**: Never commit `.env` or keys. Use platform secrets (Cloudflare Pages/GitHub Actions).

## Security & Configuration Tips
- Required env vars: `NOTION_SECRET`, `NOTION_DB_ID`, `PROJECTHUB_API_KEY`, `NOTION_IMAGE_PROXY_URL`.
- Do not expose secrets to the client; only `PUBLIC_*` env vars are browser-visible. For client utilities, prefer `import.meta.env.PUBLIC_…`.
- The image proxy Worker is a separate deployment; update its domain via env and `src/utils/imageProxy.ts`.
