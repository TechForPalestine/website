---
title: "Add An API Route"
summary: "Task guide for creating a new src/pages/api/*.ts route that matches the repo's shared conventions — prerender disabled, getEnv for secrets, Origin allowlisting before body parsing, field validation, generic client errors, and Sentry reporting — so it passes the automated PR security review."
topics: [guides, api, security]
sources:
  - id: api-doc
    type: file
    path: docs/API.md
  - id: endorsement-request
    type: file
    path: src/pages/api/endorsement-request.ts
  - id: origin-util
    type: file
    path: src/utils/origin.ts
  - id: report-error
    type: file
    path: src/lib/report-error.ts
  - id: get-env
    type: file
    path: src/utils/getEnv.ts
  - id: cache-control
    type: file
    path: src/middleware/cache-control.ts
  - id: security-scan-workflow
    type: file
    path: .github/workflows/claude-code-review.yml
---

Use this guide when adding a new endpoint under `src/pages/api/` — a form submission handler, a proxy to an external service, or any route that reads request data or calls out to a third party. The outcome is a route that matches every other route in the codebase closely enough to pass the automated PR security review without changes requested, and that a future maintainer can read in isolation without wondering why it does something differently. The full contract these steps implement is described on [Shared API Route Conventions](../architecture/api-route-conventions); this page is the ordered version of doing it.

## Preconditions

Know which upstream service the route talks to (Notion, an internal proxy, a third-party webhook) and whether it needs write access from the public browser or is a read-only passthrough. Public write endpoints — anything a browser `POST`s to directly — get the full validation treatment below; read-only or server-to-server routes need less of it, as `docs/API.md`'s route table shows for routes like `/api/events` (no Origin check, public GET) or `/api/sentry-webhook` (HMAC signature, explicitly rejects any `Origin` header) [@api-doc].

## Steps

1. **Create the file and disable prerendering.** Add `src/pages/api/your-route-name.ts` and start it with `export const prerender = false;` [@api-doc]. Without this, Astro's server-output build may try to render the route at build time instead of per request, which breaks anything that reads the incoming request or calls an external API.

2. **Read all config and secrets through `getEnv(name, locals)`, never `process.env` directly.** `getEnv` checks the Cloudflare runtime environment first, then `import.meta.env`, then `process.env` [@get-env]. On the deployed Cloudflare Pages runtime, only the first tier is populated — a route that reads `process.env.SOME_SECRET` directly gets `undefined` in production even though it may appear to work in local dev. See `endorsement-request.ts`'s use of `getEnv("NOTION_SECRET", locals)` and `getEnv("NOTION_ENDORSEMENTS_DB_ID", locals)` for the pattern [@endorsement-request].

3. **If the route accepts a public write (`POST` from a browser), validate `Origin` before parsing the body.** Import `isAllowedOrigin` and `corsHeaders` from `src/utils/origin.ts` [@origin-util]. Call `isAllowedOrigin(request.headers.get("Origin"))` and return a `403` with a generic `{ error: "Forbidden" }` body immediately if it fails — before calling `request.json()`. `endorsement-request.ts` does exactly this as the first thing inside the handler [@endorsement-request]:

   ```ts
   const origin = request.headers.get("Origin");
   if (!isAllowedOrigin(origin)) {
     return new Response(JSON.stringify({ error: "Forbidden" }), {
       status: 403,
       headers: { "Content-Type": "application/json" },
     });
   }
   ```

   The default policy (calling `isAllowedOrigin(origin)` with no second argument) only accepts `https://techforpalestine.org`. If the route also needs to work from Cloudflare Pages preview deploys or `localhost`, pass an explicit `OriginPolicy` with `allowedSuffixes` — but widen it only as much as the route's risk justifies; see the per-route comparison on [Shared API Route Conventions](../architecture/api-route-conventions) before choosing a wider policy than the default.

4. **Validate fields after the Origin check, before calling the upstream service.** For each required field: check presence, and for email fields use an email-shaped regex (`endorsement-request.ts` uses `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` [@endorsement-request]); for URL fields, wrap in `try { new URL(value) } catch { … }` and reject on failure rather than trusting the string is a URL [@endorsement-request] [@api-doc]; for free-text fields, cap length — `endorsement-request.ts` uses a 2000-character maximum applied per field in a loop [@endorsement-request] [@api-doc]. Return a `400` with a generic, field-specific message on any failure; never include the raw input value in the error response beyond what's needed to identify which field failed.

5. **Call the upstream service and handle failure with the shared error-reporting pattern.** Wrap the call in `try`/`catch`. On failure, call `reportError(error, { context: "your-route-name" })` from `src/lib/report-error.ts` — this logs to the console and forwards the exception to Sentry [@report-error] — then flush before the response finishes: `ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)))`, where `ctx` comes from `locals.runtime?.ctx` [@endorsement-request] [@api-doc]. The flush matters because a Cloudflare Worker can terminate the request as soon as the `Response` is returned, which can happen before Sentry's asynchronous network call finishes; without `waitUntil`, error reports get dropped intermittently. Return a fixed, generic error message to the client on failure (`"Failed to process request"` or similar) — never the caught error object, its `.message`, or a stack trace [@endorsement-request] [@api-doc].

6. **Do not set `Cache-Control` by hand — the shared middleware already does it.** `src/middleware/cache-control.ts` forces `Cache-Control: no-store` on every path under `/api/*` regardless of what the route itself sets, because its check is `isApi || !isGet` before deciding between `no-store` and a cacheable header [@cache-control]. A new API route does not need to set this header itself; the middleware overrides it unconditionally for anything under `/api/`.

## Verification

Run the route locally against a client that sends the right and wrong `Origin` headers and confirm the `403` path returns before any upstream call happens (add a temporary log, or watch that the Notion/EmailOctopus/etc. request never fires for a rejected Origin). Submit a request with an invalid email, a malformed URL field, and an over-length text field one at a time and confirm each returns a `400` with a message that does not leak internal details. Trigger a genuine upstream failure (e.g., a bad database ID) and confirm the client receives only the generic message while the real error appears in Sentry.

Because the new file lives under `src/pages/api/**`, opening a pull request that touches it triggers the `Security Scan` workflow (`.github/workflows/claude-code-review.yml`), which runs on `pull_request` events of type `ready_for_review` for any PR touching `src/pages/api/**`, `src/middleware/**`, `src/store/**`, `src/utils/**`, `public/_headers`, `wrangler.toml`, or `*.config.*` [@security-scan-workflow]. It runs Anthropic's `claude-code-security-review` action against the diff and comments on the PR; a route that skips one of the steps above — missing Origin check, raw error leaking to the client, `process.env` read directly — is the kind of gap this scan is built to flag. Mark the PR ready for review (not draft) to trigger it, since the workflow's trigger is `ready_for_review`, not every push [@security-scan-workflow].

## Recovery

If the security scan flags the route, the most common causes are: the Origin check happening after `request.json()` instead of before, a caught error's `.message` being interpolated into the client-facing response, or a secret read via `process.env` instead of `getEnv`. All three are visible by re-reading the route against the ordered steps above and comparing against `endorsement-request.ts` line by line [@endorsement-request]. For the full reasoning behind why these specific rules exist — not just what they are — see [Shared Security Hardening Baseline](../decisions/security-hardening-baseline).
