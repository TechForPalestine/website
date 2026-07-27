---
title: "Shared API Route Conventions"
summary: "Every src/pages/api/*.ts route disables prerendering, resolves secrets through getEnv, checks Origin before parsing a write request's body, and reports errors generically through a shared Sentry helper."
topics: [architecture]
sources:
  - id: api-doc
    type: file
    path: docs/API.md
  - id: donation-complete
    type: file
    path: src/pages/api/donation-complete.ts
  - id: endorsement-request
    type: file
    path: src/pages/api/endorsement-request.ts
  - id: report-error
    type: file
    path: src/lib/report-error.ts
  - id: origin-util
    type: file
    path: src/utils/origin.ts
  - id: pipe-route
    type: file
    path: src/pages/api/pipe.ts
  - id: sentry-webhook
    type: file
    path: src/pages/api/sentry-webhook.ts
  - id: get-env
    type: file
    path: src/utils/getEnv.ts
---

Every route under `src/pages/api/` talks to a different upstream — Notion, ProjectHub, EmailOctopus, Plausible, the Hub API, Mattermost — but they all follow the same handful of rules, stated as the "Conventions to follow for new routes" in `docs/API.md` [@api-doc] and consistently applied in the route files themselves. A route that skips one of these — forgets the `Origin` check, reads `process.env` directly, or lets a caught error reach the client — is the kind of gap the repository's automated security review is specifically watching for, so this shared shape is also the contract new routes are expected to match; see [Shared Security Hardening Baseline](../decisions/security-hardening-baseline) for how that review gate came to exist and [Add an API Route](../guides/add-an-api-route) for the step-by-step version of what follows.

## `prerender = false` and `getEnv` instead of `process.env`

Every API route sets `export const prerender = false;` [@donation-complete][@endorsement-request], which tells Astro's server-output build not to try to render the route at build time — it must run per request, since it reads the incoming request and calls external services. Routes also resolve every secret and configuration value through `getEnv(name, locals)` rather than reading `process.env` directly [@donation-complete][@endorsement-request]; `getEnv` checks the Cloudflare runtime environment (`locals.runtime.env`), then Astro's build-time `import.meta.env`, then `process.env`, in that order [@get-env]. On the deployed Cloudflare Pages runtime only the first tier is populated, so a route that reads `process.env.SOME_SECRET` directly instead of going through `getEnv` would silently get `undefined` in production. The three-tier resolution model itself, and why it exists, is covered on [Environment Variable Resolution](../concepts/environment-variable-resolution).

## Origin allowlisting before the body is touched

Public write endpoints — anything that accepts a `POST` from a browser — validate the request's `Origin` header before doing anything else, including before parsing the JSON body. The shared logic lives in `src/utils/origin.ts`: `isAllowedOrigin(origin, policy)` returns `false` for a missing `Origin` header unless the policy explicitly opts in with `allowMissingOrigin`, checks the origin against an exact-match list (`policy.allowedOrigins`, defaulting to just `https://techforpalestine.org`), and falls back to a hostname-suffix check against `policy.allowedSuffixes` [@origin-util]. `corsHeaders(origin, methods)` builds the matching `Access-Control-Allow-*` headers for the response [@origin-util].

Different routes widen this policy by different amounts, and the width tracks how much damage a forged request could do:

- `endorsement-request.ts` calls `isAllowedOrigin(origin)` with no policy argument, so it falls back to the single-origin default — only `https://techforpalestine.org` is accepted [@endorsement-request].
- `donation-complete.ts` (and `membership-complete.ts`, the same pattern) builds an explicit `OriginPolicy` that adds `.website-aun.pages.dev` as an allowed suffix, so preview deploys on that specific Cloudflare Pages project can also call it, plus `localhost:4321` outside production builds [@donation-complete].
- `pipe.ts`, the server-side proxy in front of Plausible's ingest endpoint, allows any `.pages.dev` suffix and sets `allowMissingOrigin: true` [@pipe-route]. This is deliberately the widest policy in the codebase: `pipe.ts` only relays analytics events, so a forged call has no meaningful blast radius, and same-origin requests without an `Origin` header still need to work.
- `sentry-webhook.ts` inverts the pattern entirely — it rejects any request that carries an `Origin` header at all, on the reasoning that genuine server-to-server webhook calls from Sentry never send one [@sentry-webhook]. Instead of Origin checking, it authenticates via an HMAC signature in the `sentry-hook-signature` header, verified with a constant-time comparison against a value computed from `SENTRY_WEBHOOK_SECRET` [@sentry-webhook].

For write endpoints that do accept a body, `docs/API.md` also documents required-field presence checks, an email-format regex, URL fields validated with a `try { new URL(x) } catch`, and a 2000-character cap on free-text fields [@api-doc] — `endorsement-request.ts` runs all four checks, in that order, after the Origin check and before calling Notion [@endorsement-request]. The exact allowlist for every route is tabulated on the [API routes](../reference/api-routes) reference page.

## Errors: report to Sentry, return nothing specific to the client

Every route wraps its upstream call in a `try`/`catch` and, on failure, calls `reportError(error, { context: "route-name" })` from `src/lib/report-error.ts` [@donation-complete][@endorsement-request]. `reportError` itself just logs to the console and forwards the exception to Sentry inside `Sentry.withScope`, attaching whatever context object was passed [@report-error]. It does not flush anything — each route does that separately, immediately after calling `reportError`, with `ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)))` [@donation-complete][@endorsement-request]. `ctx` comes from `locals.runtime.ctx`, the Cloudflare Workers execution context; `waitUntil` is necessary because a Worker is free to terminate the request as soon as the `Response` is returned, which can happen before Sentry's asynchronous network flush finishes — without `waitUntil`, error reports would be dropped intermittently. Whatever happened internally, the client only ever receives a fixed, generic message such as `"Failed to process request"` — never the caught error object, its message, or a stack trace [@donation-complete][@endorsement-request].

This combination — disable prerendering, resolve config through `getEnv`, gate writes on `Origin` before parsing, report through Sentry with an explicit flush, and never leak error detail to the caller — is what "matching repo conventions" means for a new route. It also underlies the integrations documented separately: the Notion-backed routes, the ProjectHub proxy, and the donation/membership conversion pipeline all sit on top of this same shape rather than reinventing it.
