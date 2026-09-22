# Donation & Membership Conversion Pipeline

End-to-end path from a QGIV donation/membership payment to the numbers shown on the admin dashboard.

## Flow

```
QGIV embedded widget (donate.astro / membership.astro)
        │  on success, client-side callback sends { transactionId } only
        ▼
POST /api/donation-complete  or  /api/membership-complete
        │
        ├──▶ Qgiv Transactions API — verify the transaction exists,
        │    status is "Accepted", and its formId is allowed here.
        │    Fails closed on any error. Email/name/tier come from here.
        │
        ├──▶ KV single-use guard (qgiv-txn:<id>)
        ├──▶ EmailOctopus (tag contact "donor" or "member")
        └──▶ (membership only) Hub API — invite as paid member

Separately, client-side Plausible tracking fires a goal event
(Monthly-donate / One-time-donate / Membership-complete) which is
proxied server-side:

Browser ──▶ POST /api/pipe ──▶ plausible.io/api/event
                  │
                  └─ if Plausible reports the event was dropped
                     (ad-blocker, bot filter, etc.) AND it's a
                     conversion goal, write a fallback record to
                     the DROPPED_CONVERSIONS KV namespace

/admin/conversions (Basic Auth) ──▶ GET /api/admin/conversion-stats
        │
        ├──▶ Plausible Stats API v2 (live counts)
        └──▶ DROPPED_CONVERSIONS KV (dropped-event fallback counts)
        merged and returned together
```

## Why the KV fallback exists

Browser ad-blockers and privacy extensions frequently block requests to `plausible.io` directly, which undercounts conversions — the same donations still happen, they just don't get tracked. Routing analytics through `/api/pipe` (same-origin, first-party) avoids most of that, but Plausible itself can still silently drop an event (e.g. bot detection). When that happens, `pipe.ts` writes a minimal record — event name, timestamp, `source`/`amount`/`membership_variant` props if present, and whether an IP/UA was available — to KV under key `dropped:<date>:<time>:<random>`. No PII beyond what Plausible's own event props already carry.

`/api/admin/conversion-stats` reads both sources for the same date range and merges them, so the dashboard reflects (live Plausible count) + (dropped-but-recovered count).

## Components

| File                                      | Role                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/api/donation-complete.ts`      | POST callback after a one-time/monthly donation completes; syncs to EmailOctopus                                                               |
| `src/pages/api/membership-complete.ts`    | POST callback after a membership payment completes; syncs to EmailOctopus **and** invites the donor to the Hub via `HUB_API_URL`/`HUB_API_KEY` |
| `src/pages/api/pipe.ts`                   | Same-origin proxy for Plausible's `/api/event` endpoint; detects and persists dropped conversion events to KV                                  |
| `src/pages/api/admin/conversion-stats.ts` | Basic-Auth-protected read endpoint merging Plausible Stats API v2 results with the KV dropped-event log                                        |
| `src/pages/admin/conversions.astro`       | Dashboard page rendering the above                                                                                                             |
| `src/utils/basicAuth.ts`                  | `isAuthorized(request, locals)` / `unauthorizedResponse()` — HTTP Basic Auth via `ADMIN_USERNAME`/`ADMIN_PASSWORD`, constant-time compared     |
| `wrangler.toml` `[[kv_namespaces]]`       | Binds `DROPPED_CONVERSIONS` (KV namespace ID + preview ID)                                                                                     |
| `src/utils/qgivVerify.ts`                 | Server-side transaction verification via Qgiv Transactions API; returns verified email, name, and tier; never trusts the client             |
| `src/utils/transactionReplay.ts`          | Marks a verified transaction ID as single-use in KV, prevents the same transaction being processed twice                                   |

## Qgiv form allowlist

Transaction verification requires the formId to match an endpoint-specific allowlist. These are hardcoded in `src/utils/qgivVerify.ts` (`MEMBERSHIP_FORMS`, `DONATION_FORMS`); adding a form requires a code change, not a configuration change:

| Endpoint                 | Allowed Form IDs | Purpose                                    |
| ------------------------ | ---------------- | ------------------------------------------ |
| `/api/membership-complete` | 1116610, 1158315 | 1116610: member + Hub invite; 1158315: supporting member (Hub invite skipped) |
| `/api/donation-complete` | 1094620          | Donor tagging only                         |

## Conversion goals tracked

`Monthly-donate`, `One-time-donate`, `Membership-complete` (see `CONVERSION_EVENTS` in `pipe.ts` and `GOALS` in `conversion-stats.ts`). `One-time-donate` and `Monthly-donate` are additionally broken down by a `source` prop; `Membership-complete` is broken down by `membership_variant`.

## Transaction verification and Origin checks

Both `/api/donation-complete` and `/api/membership-complete` verify the transaction server-side by looking it up in Qgiv's Transactions API using `QGIV_API_TOKEN`. Verification checks that the transaction status is `"Accepted"` and its formId is in the endpoint-specific allowlist above. Verification failure (bad transactionId, wrong status, mismatched formId, or API error) returns `402` and no side effects occur. The Origin check is now a defence-in-depth layer: these endpoints still verify that `Origin: https://techforpalestine.org` (or `*.website-aun.pages.dev` for preview deploys), but that alone is not sufficient — the transaction must exist and be verified. `pipe.ts` accepts the prod origin plus any `*.pages.dev` preview (looser, since it's just an analytics passthrough). Requests with a disallowed `Origin` get `403`.

## Auth for the admin dashboard

`ADMIN_USERNAME` / `ADMIN_PASSWORD` (HTTP Basic Auth, set in the Cloudflare Pages dashboard), read by `basicAuth.ts`.

## Env vars

`QGIV_API_TOKEN`, `EO_API_KEY`, `HUB_API_URL`, `HUB_API_KEY`, `PLAUSIBLE_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`. Full list in [DEPLOYMENT.md](../DEPLOYMENT.md).

## After deploying Qgiv verification changes

Two manual steps are part of shipping any change to `qgivVerify.ts`, `membership-complete.ts`, or `donation-complete.ts` — do both after every deploy that touches this flow:

1. **Make one real, low-value transaction on each of the three Qgiv forms** (Pilot Membership, Supporting Member, T4P Website Donation) and confirm the invite/tag actually lands — a Hub invite email for the two membership forms, and an EmailOctopus contact tagged `member`/`Supporting Member`/`donor` as appropriate. This is the only way to catch a Qgiv-side field rename or a broken allowlist before a real donor hits it.
2. **Watch the Sentry "Qgiv verification refused" alert for the first few days after launch.** Qgiv's reporting API can lag behind a transaction that just completed; verification fails closed in that window, so a real member or donor gets no invite/tag even though they paid. A spike in this alert shortly after a purchase is the signal that lag — not a real problem — caused the failure, and the safest recovery is to re-run verification for that transaction id once Qgiv catches up.
