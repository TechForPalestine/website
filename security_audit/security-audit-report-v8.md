# Security Audit — Tech for Palestine Website

**Version 8 · Re-review** · Confidential · Internal Use Only
techforpalestine.org · Astro 5 SSR on Cloudflare Pages
**Date:** 2026-11-03

---

This is the eighth-round re-review. It covers **44 commits** landed between v7 (`7c7a563`, 2026-09-22) and
`52e647a` (2026-11-03): 315 files, +18,727 / −34,113 lines (the deletions are mostly the dead `-new` pages and
the removed volunteer form). All 36 findings in the v7 register were re-verified. **Five v7 findings are now
fixed, including the high-severity S-1**, and none of the 25 findings fixed in v1–v6 has regressed. **Four new
low-severity findings** were identified. No Critical, High or new Medium issues remain open.

| V1         | V2         | V3         | V4         | V5         | V6         | V7         | **V8**         |
| ---------- | ---------- | ---------- | ---------- | ---------- | ---------- | ---------- | -------------- |
| 2026-03-31 | 2026-04-02 | 2026-04-06 | 2026-04-09 | 2026-04-13 | 2026-04-14 | 2026-09-22 | **2026-11-03** |

---

## Executive Summary — v8 Re-review

| Total fixed | Critical | High  | Medium | Low   | Open   |
| ----------- | -------- | ----- | ------ | ----- | ------ |
| **30**      | **0**    | **0** | **1**  | **9** | **10** |

**Remediation progress: 30 of 40 findings resolved (75%)**

### ✓ S-1 is closed: payment side effects are verified with Qgiv

`/api/membership-complete` and `/api/donation-complete` now read only a `transactionId` from the request and
look the transaction up in Qgiv's reporting API (`src/utils/qgivVerify.ts`). Email, names, tier and marketing
opt-in all come from Qgiv's record. The lookup fails closed in every case: missing token, timeout, non-2xx
response, mismatched id, status other than `Accepted`, form not on the endpoint's allowlist, or no email. The
tier is chosen by Qgiv `formId`, so a donation cannot be used to get a membership invite.
**Confirmed live:** a forged `Origin` with a bogus transaction now gets `402 Could not verify transaction`
(in v7 the same request reached the business logic). Some weaknesses remain; they are low severity and are
recorded as **T-3** and **T-4**.

### ✓ The response-header and caching findings are closed

Security headers are now set in middleware (`src/middleware/security-headers.ts`), so SSR responses carry
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY` and a CSP with
`frame-ancestors 'none'`. The one exception is `/newsletter-embed`, which allows framing by the site itself.
Pages default to `private` caching, and `/admin*`, `/api/*` and non-GET requests get `no-store` (S-2, S-3).
Sentry scrubbing is wired into all three `Sentry.init` calls (S-5), and the raw-HTML sink in the volunteer form
was removed along with the file (S-8).

### ◐ What is still open

- **S-6 (Medium):** Astro is still on 5.18.2. All four v7 Astro advisories, plus seven new ones, need 6.x or
  7.x. `axios` was bumped to 1.18.0 but now has 13 advisories (7 high) that are fixed in 1.20.0, and it runs
  both in the browser and in the Worker. The new CI audit step uses `continue-on-error`, so it never blocks.
- **Unchanged from v7:** S-4 (uncached Notion routes), S-7 (nonce `meta` tag), S-9 (`/api/pipe` origin
  policy), S-10 and L-2 (no integrity pinning on the Plausible and Qgiv scripts).
- **New:** HSTS is not sent (T-1), event-description links accept any URL scheme (T-2), and two residual
  weaknesses in the Qgiv verification flow (T-3, T-4).

---

## Complete issue register — v8 status

### Findings from rounds v1–v6

| ID            | Finding                                         | Peak severity | v8 status                      |
| ------------- | ----------------------------------------------- | ------------- | ------------------------------ |
| C-1           | API key & account ID in wrangler configs        | CRITICAL      | Fixed v2 · re-verified         |
| C-2, C-3      | Unauthenticated / unverified membership invite  | CRITICAL      | Fixed v2 · routes deleted      |
| N-1           | Webhook secret exposed in URL query param       | CRITICAL      | Fixed v3 · re-verified         |
| N-2           | Timing attack on token comparison               | HIGH          | Fixed v3 · re-verified         |
| H-1, R-1      | Secret key in client bundle / console           | HIGH          | Fixed v3/v4 · re-verified      |
| H-2, M-4      | Donor PII in responses / logs                   | HIGH          | Fixed v4 · re-verified         |
| H-3           | Middleware caches POST/API responses as public  | HIGH          | Fixed v3 · re-verified         |
| H-4           | No rate limiting                                | HIGH          | Fixed v6 · WAF, not in repo    |
| H-5           | Wildcard CORS on all endpoints                  | HIGH          | Fixed v3 · re-verified         |
| N-3           | membership-invite proxies arbitrary body fields | MEDIUM        | Fixed v3 · route deleted       |
| M-1, M-2      | No Origin check / input validation on forms     | MEDIUM        | Fixed v4 · re-verified         |
| M-3           | getEnv globalThis fallback                      | MEDIUM        | Fixed v3 · re-verified         |
| M-5           | Internal error.message in HTTP responses        | MEDIUM        | Fixed v3 · re-verified         |
| M-6           | Dual middleware conflict                        | MEDIUM        | Fixed v6 · re-verified         |
| R-2, L-4      | CSP `'unsafe-inline'`                           | MEDIUM        | Fixed v4/v6 · re-verified live |
| P-1, P-2, L-5 | project-proxy path / header issues              | MEDIUM        | Fixed v5/v6 · re-verified      |
| L-1           | Notion DB IDs in wrangler.toml                  | LOW           | Fixed v3 · re-verified         |
| L-3           | Image proxy has no authentication               | LOW           | Fixed v6 · worker gone         |
| **L-2**       | QGiv embed script loaded without SRI            | LOW           | **Open since v1**              |

### Findings from v7

| ID      | Finding                                                            | Severity | v8 status                                       |
| ------- | ------------------------------------------------------------------ | -------- | ----------------------------------------------- |
| S-1     | Completion endpoints grant invites behind a spoofable Origin check | HIGH     | **Fixed v8** · verified live (402); see T-3/T-4 |
| S-2     | Security headers absent on SSR pages                               | MEDIUM   | **Fixed v8** · verified live                    |
| S-3     | Admin dashboard served `public, max-age=600`                       | MEDIUM   | **Fixed v8** · verified live (`no-store`)       |
| S-4     | Uncached Notion GET routes fail under load                         | LOW      | Open · unchanged                                |
| S-5     | Events feed token reaches telemetry unscrubbed                     | MEDIUM   | **Fixed v8** · rotation not verifiable          |
| **S-6** | Astro two majors behind; runtime advisories                        | MEDIUM   | **Partial** · svelte fixed; astro, axios open   |
| S-7     | CSP nonce republished in a `<meta>` tag                            | LOW      | Open · unchanged                                |
| S-8     | Raw-HTML sink in volunteer form                                    | LOW      | **Fixed v8** · file deleted                     |
| S-9     | `/api/pipe` accepts no Origin and any `*.pages.dev`                | LOW      | Open · confirmed live                           |
| S-10    | Plausible script re-served first-party without integrity           | LOW      | Open · unchanged                                |

### New in v8

| ID  | Finding                                                                                                     | Severity | Status        |
| --- | ----------------------------------------------------------------------------------------------------------- | -------- | ------------- |
| T-1 | No `Strict-Transport-Security` header on any response                                                       | LOW      | Open · new v8 |
| T-2 | Event-description Markdown links rendered with any URL scheme (regression from #555)                        | LOW      | Open · new v8 |
| T-3 | Qgiv verification has no recency or amount check, leaks transaction state, and replay protection fails open | LOW      | Open · new v8 |
| T-4 | Fabricated transaction IDs each cost a Qgiv API call and a Sentry event                                     | LOW      | Open · new v8 |

---

## Live verification log — 2026-11-03, against production

| Probe                                                              | Result                                                                                                                      | Interpretation                       |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `GET /`, `/donate`, `/membership`                                  | CSP nonce + `strict-dynamic`, `frame-ancestors 'none'`, XFO DENY, nosniff, Referrer-Policy, Permissions-Policy. **No HSTS** | S-2 fixed; T-1                       |
| `GET /admin/conversions`                                           | 401, `Cache-Control: no-store`                                                                                              | S-3 fixed                            |
| `GET /api/events`                                                  | 200, `no-store`, `ACAO: *`                                                                                                  | H-3 / H-5 still correct              |
| `POST /api/membership-complete` (no Origin)                        | 403                                                                                                                         | Origin gate active                   |
| `POST /api/membership-complete` (forged Origin, bogus transaction) | **402 "Could not verify transaction"**                                                                                      | S-1 fixed                            |
| `POST /api/donation-complete` (both variants)                      | 403, then 402                                                                                                               | S-1 fixed                            |
| `POST /api/pipe` (no Origin) / (`Origin: https://evil.pages.dev`)  | 502 from upstream in both cases, never 403                                                                                  | S-9 confirmed                        |
| `GET /api/project-proxy?path=/api/method/../../api/auth/admin`     | 503 "Proxy not configured"                                                                                                  | Proxy inert; guard verified in code  |
| `GET /js/web.js`                                                   | 200, `public, max-age=86400`                                                                                                | S-10 unchanged                       |
| 20 × concurrent `GET /api/faq`                                     | 20 × 200                                                                                                                    | Below GET threshold (no large burst) |

No probe wrote data. The completion-endpoint probes used a non-existent transaction id, which Qgiv rejects
before any Hub or EmailOctopus call.

---

## New findings — detail

### T-1 · LOW — No `Strict-Transport-Security` header

**Files:** `src/middleware/security-headers.ts` · Cloudflare zone settings
**OWASP:** A05:2021 – Security Misconfiguration

None of the HTML, API or static responses checked carries HSTS. Cloudflare redirects HTTP to HTTPS, but
without HSTS a visitor's first plain-HTTP request (from a typed URL or an old link) can be intercepted on a
hostile network before that redirect happens. The donate and membership pages make this worth closing.

**Fix:** Enable HSTS in the Cloudflare dashboard (SSL/TLS → Edge Certificates), or add it to the middleware:

```ts
response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
```

Start without `preload`, and only add `includeSubDomains` after confirming every subdomain serves HTTPS.

---

### T-2 · LOW — Event-description Markdown links are rendered with any URL scheme

**Files:** `src/utils/eventDescription.tsx:69-82` · `src/store/eventsClient.ts` (`resolveLinks`) ·
`src/components/events/EventDetailsDialog.tsx:194,205`
**OWASP:** A03:2021 – Injection · **Introduced:** PR #555 (regression)

#555 replaced the hand-written description parser, which only made links out of `https?://` targets, with the
`marked` lexer. The `link` token's `href` now goes straight into `<a href>` without a scheme check. Anyone who
can write to the Mattermost Events Calendar can publish `[Register](data:…)` or a link to an OS protocol handler
(`ms-officecmd:`, `search-ms:`), and it will appear in the event dialog on `/events`. `javascript:` URLs are
neutralised twice: React 19 blocks them, and the nonce CSP would block them anyway. That leaves phishing and
protocol-handler abuse, and it needs calendar write access, so the severity is Low. The `registerLink`,
`locationLink` and `watchLink` fields from the ICS feed were already unsanitised before v7 and should be fixed
together with this.

**Fix:** Reuse the existing helper, as `projectsClient.ts` already does:

```tsx
case "link": {
  const href = sanitizeUrl(link.href);
  if (!href) return <Fragment key={key}>{renderInlineTokens(link.tokens, key)}</Fragment>;
  return <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="underline">…</a>;
}
```

Apply `sanitizeUrl` to the three link fields in `resolveLinks()`, and add tests with `javascript:` and `data:` links.

---

### T-3 · LOW — Qgiv verification has no recency or amount check, leaks transaction state, and replay protection fails open

**Files:** `src/utils/qgivVerify.ts:102-155` · `src/utils/transactionReplay.ts` ·
`src/pages/api/membership-complete.ts:42-65` · `src/pages/api/donation-complete.ts:39-66`
**OWASP:** A04:2021 – Insecure Design

S-1's fix is sound: an attacker can no longer cause an invite or subscription for an address that has not
paid. These residual gaps all fall short of that:

- **No recency check.** Any `Accepted` transaction on an allowed form, at any age, is acted on once. Qgiv
  transaction ids are numeric and probably sequential (not confirmed), so ids can be enumerated within the
  POST rate limit to trigger Hub invites and list tags for real past payers. Those emails go to the people who
  actually paid, so the harm is unwanted contact and data-integrity noise, not access.
- **Responses reveal transaction state.** `402`, `200 Not opted in`, `200 Already processed` and
  `200 success` let an enumerator tell real transactions from fake ones and learn each donor's opt-in choice.
- **The amount is not checked.** `amount` is parsed but never used. If the Pilot Membership form accepts
  custom amounts, a token payment still earns a paid-tier invite. This depends on the Qgiv form configuration.
- **Replay protection fails open and is not atomic.** `claimTransaction()` allows the request when the KV
  binding is missing or KV throws (this is deliberate, and documented in the file). Its `get` then `put` can be
  raced by concurrent requests, and keys expire after 30 days, after which the same id can be processed again.
  The replay keys also share the `DROPPED_CONVERSIONS` namespace with `/api/pipe`.

**Fix:**

- Reject transactions older than a short window (24–72 h) using Qgiv's transaction date, and keep the replay
  TTL at least that long. This one change also closes the enumeration and expiry gaps.
- Return the same response body for every verified outcome, and the same one for every failure.
- Check `amount` against a minimum for each form in `MEMBERSHIP_FORMS`.
- Move the replay keys to their own KV namespace.

---

### T-4 · LOW — Fabricated transaction IDs each cost a Qgiv API call and a Sentry event

**Files:** `src/utils/qgivVerify.ts:21,107-126` · `membership-complete.ts:41-56` · `donation-complete.ts:38-53`
**OWASP:** A04:2021 – Insecure Design / A09:2021

The handlers skip Sentry for `invalid-id` so that callers cannot burn Sentry quota, but
`TRANSACTION_ID_PATTERN` (`/^[A-Za-z0-9_-]{1,64}$/`) accepts any made-up id such as `"1"`. Each request with a
forged `Origin` then makes an authenticated call to Qgiv's reporting API with the organisation-wide token,
fails as `lookup-failed`, and is sent to Sentry. A loop can therefore flood Sentry, hiding the real
"propagation lag" signal and using up quota. It could also get the Qgiv token throttled, and because
verification fails closed, genuine new members would then get no invite. The POST rate limit caps the rate.

**Fix:** Narrow the pattern to Qgiv's real format (`/^\d{1,20}$/`). Sample or aggregate `lookup-failed`
reports instead of sending one per request. Consider a per-IP KV counter on these two routes.

---

## Still open from earlier rounds

### S-6 · MEDIUM (partial) — Runtime dependency advisories

`pnpm audit` on the committed lockfile reports 3 critical, 19 high, 33 moderate and 11 low (prod only: 1 / 19 / 30 / 11).
Since v7, svelte was bumped to 5.55.7 (clean), `react-router-dom` and `install` were removed, and a CI audit step
was added. The runtime packages that still have advisories:

| Package             | Pinned          | Fixed in    | Notes                                                                                                                                     |
| ------------------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| astro               | 5.18.2          | 6.x / 7.3.2 | The four v7 GHSAs plus 7 new ones, including authorization-bypass/path-segment issues. AVIF RCE mitigated by `imageService: "cloudflare"` |
| axios               | 1.18.0          | 1.20.0      | 13 advisories, 7 high. Used by `src/store/api.ts` (browser) and `notionClient.ts` (Worker)                                                |
| follow-redirects    | 1.16.0          | 1.16.2      | 3 high, pulled in by axios                                                                                                                |
| zod                 | 3.25.76 / 4.6.5 | 4.6.6       | High (memory exhaustion)                                                                                                                  |
| undici              | 6.29.0          | 6.29.1      | 3 high                                                                                                                                    |
| @astrojs/cloudflare | 12.6.13         | 13.1.10     | Low (SSRF via redirect following)                                                                                                         |

**Fix:** Bump axios to ≥ 1.20.0 now (minor version). Refresh follow-redirects, zod and undici through
`pnpm.overrides`. Schedule the Astro 5 → 7 upgrade with `@astrojs/cloudflare` 13 as its own piece of work.
Remove `continue-on-error` from the CI audit step once the baseline is clean.

### S-4, S-7, S-9, S-10, L-2 — unchanged

The code and fixes described in v7 still apply as written. S-4: only `projectsClient.ts` uses
`resolveWithCache()`. S-7: the nonce `meta` tag and prototype patches are now in `CspStylePatch.astro`. S-9:
`pipe.ts:8-11` still has `allowedSuffixes: [".pages.dev"]` and `allowMissingOrigin: true`, and both were confirmed
live. S-10 / L-2: there is still no integrity check on `web.js.ts` or on the Qgiv `embed.js` injections.

---

## Observations (not rated)

- **Sentry context is not scrubbed.** `beforeSend` cleans messages, exceptions, request URLs and breadcrumbs,
  but not `event.contexts` or `extra`. Today `reportError` contexts include upstream response bodies
  (`pipe.ts`, Hub errors in `membership-complete.ts`). None carries the ICS token now, but a scrub of those
  fields would keep it that way.
- **`project-proxy.ts` passes all upstream response headers back to the browser**, including any
  `Set-Cookie`. The proxy is unconfigured in production; fix it before it is switched back on.
- **CI actions are pinned by mutable tag** (`lycheeverse/lychee-action@v2`,
  `anthropics/claude-code-security-review@v1`, `pnpm/action-setup@v6`). Workflows use `pull_request`, not
  `pull_request_target`, so fork PRs get no secrets. Pinning to commit SHAs is cheap hardening.
- **`isParsableUrl` accepts `javascript:`** on the E4P `linkedin` field. The value is never rendered back
  today; switch to `sanitizeUrl` if that changes.

---

## Security posture progress — all rounds

| Round  | Date           | Critical | High  | Medium | Low   | Total open | Fixed  |
| ------ | -------------- | -------- | ----- | ------ | ----- | ---------- | ------ |
| v1     | 2026-03-31     | 3        | 5     | 6      | 3     | 17         | —      |
| v2     | 2026-04-02     | 1        | 6     | 7      | 3     | 17         | 3      |
| v3     | 2026-04-06     | 0        | 2     | 5      | 3     | 10         | 10     |
| v4     | 2026-04-09     | 0        | 1     | 2      | 3     | 6          | 16     |
| v5     | 2026-04-13     | 0        | 1     | 2      | 4     | 7          | 17     |
| v6     | 2026-04-14     | 0        | 0     | 0      | 1     | 1          | 24     |
| v7     | 2026-09-22     | 0        | 1     | 4      | 6     | 11         | 25     |
| **v8** | **2026-11-03** | **0**    | **0** | **1**  | **9** | **10**     | **30** |

---

## Remediation plan — v8

| Priority       | Action                                                                                                                                                | ID        | Effort           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------- |
| **This week**  | Bump axios to ≥ 1.20.0; override follow-redirects, zod and undici.                                                                                    | S-6       | 1 hour           |
| **This week**  | Enable HSTS (Cloudflare dashboard or middleware).                                                                                                     | T-1       | 15 min           |
| **This week**  | Pass event-description and ICS link fields through `sanitizeUrl`.                                                                                     | T-2       | 30 min           |
| **This month** | Add a recency window and per-form minimum amount to Qgiv verification; make responses uniform; narrow the id pattern; sample `lookup-failed` reports. | T-3, T-4  | half day         |
| **This month** | Tighten `/api/pipe`'s origin policy to `.website-aun.pages.dev` and drop `allowMissingOrigin`.                                                        | S-9       | 15 min           |
| **This month** | Cache the Notion reads through `resolveWithCache()`.                                                                                                  | S-4       | half day         |
| Backlog        | Astro 5 → 7 upgrade; then make the CI audit step blocking.                                                                                            | S-6       | multi-day        |
| Backlog        | Pin SHA-384 hashes for the Qgiv embed and the proxied Plausible script.                                                                               | L-2, S-10 | 2 hours + vendor |
| Backlog        | Replace the nonce `meta` tag and prototype patches with an Emotion cache nonce.                                                                       | S-7       | 1 day            |

---

## Good practices confirmed in the v8 codebase

- **Payment verification is well built.** Fixed API base URL, a bounded id pattern, matching of the
  requested id, a per-endpoint form allowlist, fail-closed on every error path, and the token sent in the POST
  body rather than the URL. The supporting-member form deliberately gets no Hub invite.
- **No new raw-HTML sinks.** The only `set:html` uses are JSON-LD built from constants. The Hub open-roles
  `descriptionHtml.ts` is an allowlisting tokenizer that sanitises hrefs.
- **The newsletter embed's `postMessage` is checked properly.** It checks both `event.origin` and
  `event.source`, and validates and caps the payload.
- **The nav A/B test sets no cookie.** It assigns variants with an HMAC of day + IP + User-Agent under a secret
  resolved through `getEnv`, and the IP is never stored or sent to the client.
- **The middleware order is pinned by a test** (`src/middleware/index.test.ts`), and the shared
  `withOriginGuard` checks Origin before parsing the body, with suffix matching on label boundaries.
- **Test coverage of the security utilities grew substantially.** `crypto`, `getEnv`, `origin`, `basicAuth`,
  `qgivVerify`, `transactionReplay`, `safeProxy`, `sanitizeUrl` and `validate` all have suites now.
- **No secrets in the diff.** A pattern scan for keys, tokens, JWTs, DSNs and PEM headers found none.

---

## Method and scope

Static review of the full diff `7c7a563..52e647a` (44 commits), with current-file reading of every API route,
the middleware chain, the security utilities, the data clients and the components that render upstream
content. Each of the 36 findings in the v7 register was re-checked against current code. This was supplemented
by `pnpm audit` against the committed `pnpm-lock.yaml` and the non-destructive live probes logged above.

Not covered: the ProjectHub, Hub, Qgiv and Mattermost services themselves; Cloudflare dashboard configuration
(including the WAF rate-limit thresholds) beyond what live responses reveal; whether the ICS token was rotated
after S-5; and authenticated behaviour of `/admin/conversions`.

---

## Bottom line

The urgent item from v7 is resolved properly. Payment-triggered actions are now decided by Qgiv's own record,
fail closed, and the fix was verified against production. The headers, caching and telemetry findings are also
closed. What remains is a Medium dependency backlog, mainly the Astro major upgrade and a cheap axios bump,
and nine Low items, most of which take under an hour each. The new findings are all small. T-2 is worth
noting as a pattern: replacing a hand-written parser with a library silently dropped a scheme check the old
code had, and the existing `sanitizeUrl` helper closes it.

---

_Tech for Palestine — Security Audit Report v8 — 2026-11-03 — Confidential · Internal Use Only_
