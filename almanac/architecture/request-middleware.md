---
title: "The Request Middleware Pipeline"
summary: "A single sequence(cacheControl, csp) entrypoint sets Cache-Control headers before generating a per-request CSP nonce, and CSP is only enforced on the real Cloudflare runtime."
topics: [architecture]
sources:
  - id: middleware-index
    type: file
    path: src/middleware/index.ts
  - id: cache-control
    type: file
    path: src/middleware/cache-control.ts
  - id: csp-middleware
    type: file
    path: src/middleware/csp.ts
  - id: architecture-doc
    type: file
    path: docs/ARCHITECTURE.md
  - id: layout-astro
    type: file
    path: src/layouts/Layout.astro
---

Every request the site serves passes through exactly one middleware entrypoint, `src/middleware/index.ts`, which runs two stages in a fixed order: `export const onRequest = sequence(cacheControl, csp)` [@middleware-index]. `cacheControl` decides how the response should be cached; `csp` issues a per-request nonce and, only on the real Cloudflare Workers runtime, rewrites the HTML to lock down what scripts and styles are allowed to run. The two stages are small on their own, but the order between them and the fact that there is only one entrypoint are both load-bearing: getting either wrong has caused a production incident, recorded on the [middleware order and single entrypoint](../decisions/middleware-order-and-single-entrypoint) decision page.

## `cache-control`: setting headers around `next()`

`cacheControl` calls `next()` first and inspects the response it gets back [@cache-control]. Its logic is a single conditional: if the response doesn't already carry a `Cache-Control` header, or the request is an API route (`/api/*`), or the method isn't `GET`, it sets `Cache-Control` to `no-store` for non-GET or API requests, and to `public, max-age=600` otherwise [@cache-control]. In practice this means a page route that returns a `GET` response without setting its own `Cache-Control` header gets a ten-minute public cache by default, while every `/api/*` route and every non-GET request is forced to `no-store` even if that route tried to set something else — the API contract described on [Shared API Route Conventions](api-route-conventions) can rely on this: API responses are never cached at the edge regardless of what an individual route returns.

## `csp`: nonce generation and HTMLRewriter

`csp` runs second. Before calling `next()`, it generates a per-request nonce with `crypto.randomUUID().replace(/-/g, "")` and stores it on `context.locals.cspNonce` [@csp-middleware], which is why `Layout.astro` can read `Astro.locals.cspNonce` while rendering the page shell and expose it as a `<meta name="csp-nonce">` tag for client-side scripts to pick up later [@layout-astro].

After `next()` resolves, `csp` checks the response's `Content-Type`. If it isn't `text/html`, the response passes through untouched. If it is HTML, the middleware builds a strict Content-Security-Policy string — `default-src 'self'`, a `script-src` built around `'nonce-<value>' 'strict-dynamic'` plus a fixed allowlist of third-party script hosts (Qgiv, a chat widget, Google/gstatic, jsdelivr, an AWS `execute-api` endpoint), a `style-src` covering Google Fonts and Qgiv, `connect-src` covering Plausible, Sentry ingest, CharityStack, and the same AWS endpoint, `frame-src` covering Qgiv, Calendly, YouTube, and CharityStack, and `object-src 'none'` [@csp-middleware]. Then comes the part that only works on Cloudflare: it checks whether the global `HTMLRewriter` constructor exists. `HTMLRewriter` is a Cloudflare Workers-only streaming HTML transformer with no equivalent in Node, so under `pnpm dev` (which runs on Node) the check fails and `csp` returns the response as-is — no nonce is injected into any tag, and the `Content-Security-Policy` header is never set [@csp-middleware]. Only when the code is actually executing inside a Cloudflare Workers runtime — a preview deploy or production — does `HTMLRewriter` exist, and only then does the middleware add `nonce="<value>"` to every `<script>` and `<style>` tag in the streamed HTML and set the `Content-Security-Policy` header on the (possibly new) response object that `HTMLRewriter.transform()` returns [@csp-middleware]. This gap is deliberate but easy to forget: a CSP change that looks correct in `pnpm dev` has not actually been exercised, because dev never runs the enforcement path.

## Why `cacheControl` must run first

`HTMLRewriter.transform()` can return a different `Response` object than the one `cacheControl` set headers on. The comment in `src/middleware/index.ts` states the reasoning directly: `cacheControl` runs first so its header lands on every response, and `csp` runs second because it may replace the response object via `HTMLRewriter`, with the cache-control header preserved on the transformed response [@middleware-index]. Reversing the order would risk `csp` handing back a fresh `Response` whose headers were never touched by `cacheControl`, silently dropping the caching contract for every HTML page. `docs/ARCHITECTURE.md` documents the same ordering constraint for anyone auditing the pipeline without reading the source directly [@architecture-doc].

The single-entrypoint shape matters just as much as the ordering: Astro resolves middleware from one specific file location, and a second, competing middleware file placed elsewhere in the project would silently take over request handling and disable this entire pipeline — cache headers and CSP both — without any error. That incident and the resulting rule are covered on the decision page linked above rather than repeated here; this page describes the mechanism as it exists today. Verifying a CSP change therefore requires stepping outside `pnpm dev`, which is covered on the [verify CSP changes locally](../guides/verify-csp-changes-locally) guide, and the broader ruleset this pipeline is one piece of is recorded on the [security hardening baseline](../decisions/security-hardening-baseline) decision page. See [Rendering Model, Build, and Deployment](rendering-and-deployment) for how this middleware fits into the request lifecycle on the Cloudflare adapter.
