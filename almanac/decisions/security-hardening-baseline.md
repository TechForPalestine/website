---
title: "Security Hardening Baseline"
summary: "Six rounds of external security auditing produced a fixed ruleset — secrets only via getEnv, webhook auth by signed header, constant-time comparisons, Origin checks before body parsing, proxy path normalization, no wildcard CORS on writes, generic client errors — now enforced by an automated PR review gate on the highest-risk paths."
topics: [decision, security]
sources:
  - id: security-md
    type: file
    path: docs/SECURITY.md
  - id: findings-csv
    type: file
    path: security_audit/security-audit-findings.csv
  - id: review-workflow
    type: file
    path: .github/workflows/claude-code-review.yml
  - id: crypto-util
    type: file
    path: src/utils/crypto.ts
  - id: project-proxy
    type: file
    path: src/pages/api/project-proxy.ts
  - id: sentry-webhook
    type: file
    path: src/pages/api/sentry-webhook.ts
  - id: membership-page
    type: file
    path: src/components/MembershipPage.tsx
---

## Status

Adopted. `docs/SECURITY.md` states every rule below "in direct response to a finding that was actually exploited or exploitable — not speculative hardening," and instructs maintainers not to regress them [@security-md]. The rules accumulated across six rounds of external audit, recorded finding-by-finding in `security_audit/security-audit-findings.csv`, with one finding still open as of the latest round.

## Context

The findings CSV spans audit rounds v1 through v6 and records the pattern that produced this baseline: nearly every rule in `docs/SECURITY.md` maps to at least one specific, dated finding, not a generic best practice imported wholesale. Reading the two files together shows the ruleset was built reactively — a critical finding in an early round (v1) is a secret committed to `wrangler.toml`, an unauthenticated endpoint, or a webhook with no verification; later rounds (v2–v6) catch progressively subtler variants of the same underlying classes of bug, such as a secret comparison using `!==` instead of a constant-time function, or a proxy route that can be walked outside its intended path prefix with dot-segments [@findings-csv].

## Decision

The project holds to a fixed set of rules, each traceable to the finding that produced it:

- **Secrets live only in the Cloudflare Pages dashboard**, resolved through `getEnv(name, locals)`, never committed to source or config. This closes finding **C-1** (`PROJECTHUB_API_KEY` hardcoded in `wrangler.toml`, Critical, fixed v2) and **L-1** (Notion DB IDs in `wrangler.toml`, Low, fixed v3) [@findings-csv][@security-md].
- **A secret is never bundled into client-executed code**, including as an axios default header. If the browser needs an authenticated call, a server-side proxy attaches the credential instead — `project-proxy.ts` is the canonical example, adding the `Authorization` header itself after validating the request rather than letting the browser hold the key [@project-proxy]. This closes **H-1** (a secret key logged to the browser console, High, fixed v3) and **R-1** (`PUBLIC_SECRET_KEY` bundled into client JS via an Axios instance, Medium, fixed v4) [@findings-csv].
- **Webhook endpoints authenticate via a signed header, never a URL query parameter.** `sentry-webhook.ts` verifies an HMAC-SHA256 signature carried in the `sentry-hook-signature` header before parsing the body [@sentry-webhook]. This closes **N-1**, where an earlier fix had put the webhook secret in `?secret=TOKEN` — which then leaked into Cloudflare/proxy access logs — before it was moved to a header (Critical, fixed v3) [@findings-csv].
- **Secret and signature comparisons use `constantTimeEqual(a, b)`** from `src/utils/crypto.ts`, which wraps Node's `timingSafeEqual` after checking the two strings are equal length, never a plain `===`/`!==` [@crypto-util]. This closes **N-2** (timing attack on a `!==` token comparison, High, fixed v3) [@findings-csv].
- **Public write endpoints validate `Origin` before parsing the request body**, rejecting anything outside `https://techforpalestine.org` or a small set of approved preview-deploy suffixes. This closes **M-1** (no CSRF/Origin check on form endpoints, Medium, fixed v4) [@findings-csv][@security-md].
- **Proxy routes normalize the upstream path and use an explicit header allowlist.** `project-proxy.ts` runs the requested path through `new URL(path, "http://localhost").pathname` before checking it starts with `/api/method/`, and only forwards `content-type`, `accept`, `accept-language`, and `accept-encoding` from the incoming request rather than copying every header [@project-proxy]. This one route alone closes three findings: **P-1** (any upstream path reachable with auth because only a leading `/` was checked, Medium, fixed v5), **P-2** (a dot-segment traversal bypassing the `/api/method/` prefix check, Medium, fixed v6), and **L-5** (all browser headers forwarded, including `Cookie` and `X-Forwarded-For`, Low, fixed v6) [@findings-csv].
- **No wildcard CORS on POST/PUT/PATCH/DELETE endpoints.** `Access-Control-Allow-Origin: *` is reserved for read-only `GET` routes serving public data. This closes **H-5** (wildcard CORS present on write endpoints, High, fixed v3) [@findings-csv].
- **Only generic error messages reach the client**; the real error and stack trace go to `reportError()` and Sentry, never the HTTP response body. This closes **M-5** (raw `error.message` leaked in responses, Medium, fixed v3) and **H-2** (a full donor PII payload echoed back in a webhook response, High, fixed v4) [@findings-csv].
- **No full PII in logs** — emails are redacted to domain-only before any log call. This closes **M-4** (full donor emails written to server logs, Medium, fixed v4) [@findings-csv].

## Consequences

The highest-risk surface is now covered by an automated gate rather than relying solely on manual review: `.github/workflows/claude-code-review.yml` runs `anthropics/claude-code-security-review@v1` on pull requests once they're marked ready for review, scoped by a path filter to `src/pages/api/**`, `src/middleware/**`, `src/store/**`, `src/utils/**`, `public/_headers`, `wrangler.toml`, and `*.config.*` [@review-workflow]. A PR that only touches component markup or content never triggers the scan; a PR that touches an API route, the middleware pipeline, or a config file always does. This makes the ruleset above self-enforcing for new code in exactly the areas where the audit history shows violations have actually occurred — every finding above is rooted in one of those same path patterns.

Not every finding is closed. **L-2** — the QGiv donation embed script loaded via `document.createElement("script")` in `src/components/MembershipPage.tsx` with no Subresource Integrity hash — remains **Open** in the latest audit round, flagged as a supply-chain risk with no fix date recorded [@findings-csv][@membership-page]. Anyone touching the QGiv embed or evaluating third-party script risk on this page should treat that as a known, currently unresolved gap rather than an already-fixed item.

This decision sets the ruleset; [Shared API Route Conventions](../architecture/api-route-conventions) shows how the rules concretely appear inside every `src/pages/api/*.ts` route, and [Add an API Route](../guides/add-an-api-route) is the step-by-step guide for building a new route that passes both manual review and the automated gate. The full finding list, with exact IDs, categories, and fix versions, is tabulated on [security audit findings](../reference/security-audit-findings).
