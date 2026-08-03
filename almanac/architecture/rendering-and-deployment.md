---
title: "Rendering Model, Build, and Deployment"
summary: "The site runs as an Astro server-rendered app on Cloudflare Pages, built by a fixed integration chain and gated by a single CI job."
topics: [architecture]
sources:
  - id: astro-config
    type: file
    path: astro.config.mjs
  - id: wrangler-toml
    type: file
    path: wrangler.toml
  - id: deployment-doc
    type: file
    path: DEPLOYMENT.md
  - id: ci-workflow
    type: file
    path: .github/workflows/ci.yml
  - id: agents-md
    type: file
    path: AGENTS.md
  - id: content-config
    type: file
    path: src/content/config.ts
---

Tech for Palestine's website is an Astro v5 project running in `output: "server"` mode on the `@astrojs/cloudflare` adapter, not a statically prebuilt site [@astro-config]. Almost every route is rendered per request on Cloudflare's Workers runtime, which is why the [request middleware pipeline](request-middleware), the runtime-aware `getEnv()` fallback chain, and Cloudflare-only globals like `HTMLRewriter` all matter at request time rather than build time. Deployment is automatic: pushing to `main` triggers a Cloudflare Pages build that runs `pnpm build` and publishes the `dist/` output [@deployment-doc], while a separate GitHub Actions job gates every push and pull request against `main` with a type check and a build, but no test suite.

## Server rendering and the adapter

The `cloudflare()` adapter is configured with `imageService: "cloudflare"`, so Astro's image optimization runs through Cloudflare's image service rather than a Node-based sharp pipeline [@astro-config]. `wrangler.toml` sets `compatibility_flags = ["nodejs_compat"]`, which is what allows server code to use Node built-ins at all inside the Workers runtime, and declares one KV namespace binding, `DROPPED_CONVERSIONS`, used by the donation-conversion pipeline to log Plausible events an ad blocker dropped [@wrangler-toml]. `pages_build_output_dir = "dist"` tells Cloudflare Pages where to pick up the build [@wrangler-toml].

Because output is server-rendered rather than static, the Vite build is tuned for the Workers environment rather than the browser: in production builds, `react-dom/server` is aliased to `react-dom/server.edge` so React's SSR renderer doesn't pull in Node-only APIs, several `node:` built-ins (`node:fs/promises`, `node:path`, `node:url`, `node:crypto`) are marked external for SSR bundling, and source maps are generated as `"hidden"` — present on disk for Sentry to upload, but not referenced by a public `sourceMappingURL` comment [@astro-config]. React and Svelte components still act as client islands on top of this SSR shell: most hydrate with `client:load` or `client:only`, rendering nothing (or a server-provided prop payload) until the browser takes over.

`prefetch.defaultStrategy: "hover"` means Astro's built-in prefetch script preloads a linked page's HTML when the user hovers a link, before they click it [@astro-config].

## Integration chain

`astro.config.mjs` wires integrations in a fixed order: `sentry()`, `icon()`, `react()`, `tailwind({ applyBaseStyles: false })`, `svelte()`, then `sitemap()` [@astro-config].

- `sentry()` is configured for the `tech-for-palestine` org and `javascript-astro` project, and only uploads source maps when `SENTRY_AUTH_TOKEN` is present in the build environment — this is why `DEPLOYMENT.md` calls out that the token must be set at **build** time, not just runtime [@astro-config][@deployment-doc].
- `tailwind()` is set to `applyBaseStyles: false`, so Tailwind's own base/reset CSS is not auto-injected on every page; the site supplies its own base styles instead.
- `svelte()` turns on `compilerOptions.experimental.async`, enabling Svelte's async component features.
- `sitemap()` takes a `filter` callback that excludes a fixed list of path suffixes — every `-new` redesign route, `admin/conversions`, and several one-off orphan pages — from `sitemap-index.xml`. This is the mechanism, not just a convention, that keeps unfinished or duplicate pages out of Google's index; see [Routing and Navigation](routing-and-navigation) for how this connects to the `-new` page pattern.

Astro's content collections are configured as an empty object in `src/content/config.ts` [@content-config]; the site no longer serves any page from local Markdown collections, a change covered in more detail on the [empty content collections](../decisions/empty-content-collections) decision page.

## CI and the deploy gate

`.github/workflows/ci.yml` runs on every push and pull request targeting `main`. The job checks out the repo, installs `pnpm` via `pnpm/action-setup`, sets up Node using the version pinned in `.nvmrc`, installs dependencies with `pnpm install --frozen-lockfile`, then runs `pnpm run check` (Astro's type checker) followed by `pnpm run build` [@ci-workflow]. There is no test step: `AGENTS.md` states plainly that no test framework is configured yet and that Vitest plus Testing Library is the preferred choice if tests are added later [@agents-md]. That means CI's only defense against a broken change is that the project type-checks and that `astro build` completes — it does not verify behavior.

The actual production deploy is a separate mechanism from CI: Cloudflare Pages watches `main` directly and runs its own `pnpm build` on push, independent of the GitHub Actions job [@deployment-doc]. A green CI run on a pull request does not deploy anything; only a merge to `main` does, at which point Cloudflare Pages builds and publishes `dist/`.
