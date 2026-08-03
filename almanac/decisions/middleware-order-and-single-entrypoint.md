---
title: "Middleware Order and Single Entrypoint"
summary: "The project enforces exactly one middleware file, src/middleware/index.ts, running sequence(cacheControl, csp) in that fixed order — a rule written after two separate production incidents, one from a wrong header default and one from a duplicate file silently disabling the pipeline."
topics: [decision, security, middleware]
sources:
  - id: middleware-index
    type: file
    path: src/middleware/index.ts
  - id: security-md
    type: file
    path: docs/SECURITY.md
  - id: findings-csv
    type: file
    path: security_audit/security-audit-findings.csv
  - id: cache-control
    type: file
    path: src/middleware/cache-control.ts
---

## Status

Adopted and actively enforced. `src/middleware/index.ts` is the single request pipeline entrypoint, running `export const onRequest = sequence(cacheControl, csp)` [@middleware-index], and `docs/SECURITY.md` states the rule as a standing constraint rather than a one-time fix: "There must be exactly one middleware entry point: `src/middleware/index.ts`. A parallel `src/middleware.ts` will shadow it" [@security-md].

## Context

Astro resolves middleware from a single file location per project. If a second file that also qualifies as a middleware entrypoint exists elsewhere in the project, Astro picks one and the other is never invoked — silently, with no build error or runtime warning. This is a sharp edge for a two-stage pipeline like this one, where `cacheControl` sets caching headers and `csp` issues a per-request nonce and rewrites HTML to enforce Content-Security-Policy: if the whole pipeline stops running, both the caching contract and the CSP protection disappear at once, and nothing in the deploy process flags it.

Two separate, real incidents are recorded against this file in `security_audit/security-audit-findings.csv`, the six-round external audit log for this repository. The first, finding **H-3** ("Middleware cached POST/API responses as public," severity High, introduced in audit round v1, fixed in v3), was a bug in the cache-control logic itself: `Cache-Control` was set to `public, max-age=600` on every response, including API routes and non-GET requests that could carry sensitive data, because the header wasn't conditioned on the request path or method [@findings-csv]. The fix made `cache-control.ts` route-aware — it now forces `no-store` whenever the path starts with `/api/` or the method isn't `GET`, and only falls back to the ten-minute public cache for an ordinary page `GET` that hasn't already set its own header [@cache-control].

The second incident, finding **M-6** ("Dual middleware files — cache-control layer was dead code," severity Medium, introduced in audit round v5, fixed in v6), was a different and more structural failure: a parallel `src/middleware.ts` file existed alongside `src/middleware/index.ts`, and Astro loaded only `src/middleware.ts` [@findings-csv]. That meant the entire `sequence(cacheControl, csp)` pipeline — the fixed H-3 cache logic included — never ran in production for a period of time, even though the code in `src/middleware/index.ts` looked correct and passed review. The fix, per the CSV's notes column, was to remove the shadow file and refactor into the current `sequence(cacheControl, csp)` shape with `cache-control.ts` and `csp.ts` as separate modules [@findings-csv].

## Decision

The project runs exactly one middleware entrypoint, `src/middleware/index.ts`, and that file always sequences `cacheControl` before `csp`. `cacheControl` runs first because it must see and set headers on every response; `csp` runs second because `HTMLRewriter.transform()` can hand back a different `Response` object than the one `cacheControl` touched, and running cache-control second would risk that replacement response never receiving a `Cache-Control` header at all — the ordering comment directly above `sequence(cacheControl, csp)` in the source states this reasoning [@middleware-index]. `docs/SECURITY.md` repeats both the ordering rationale and the single-entrypoint rule explicitly, "worth repeating since it's an easy mistake to reintroduce" [@security-md].

## Consequences

A change to request-level behavior — a new response header, a new redirect, an auth check that should apply site-wide — belongs inside `cacheControl` or `csp`, or as a new stage added to the same `sequence()` call in `src/middleware/index.ts`, never as a second, independent middleware file anywhere else in the project. Any PR that adds a file Astro could interpret as a competing middleware entrypoint should be treated as a regression of finding M-6, not a stylistic choice. The ordering constraint is equally non-negotiable: swapping the two stages would silently reintroduce something like the H-3 class of bug, where a transformed response loses headers set earlier in the chain.

This decision only covers the shape of the pipeline. What each stage actually enforces — the exact `Cache-Control` values `cacheControl` sets, and the CSP directives and nonce mechanism `csp` builds — is described on [The Request Middleware Pipeline](../architecture/request-middleware). The exact finding IDs, severities, and audit rounds cited above are catalogued in full on [security audit findings](../reference/security-audit-findings), and this decision is one piece of the broader ruleset recorded on [the security hardening baseline](security-hardening-baseline).
