# GrowthBook Integration Research

This is a **research document** — GrowthBook is not yet integrated into this codebase. It exists
to inform a future integration plan and was written by tracing claims back to GrowthBook's primary
docs/source rather than blog posts. No packages have been installed and no application code has
been changed as part of this doc.

## 1. What GrowthBook is

GrowthBook is an open-source feature flag and A/B testing/experimentation platform. GrowthBook
Cloud and self-hosting run the identical codebase: "The exact same code that powers our Cloud
platform is available for you to run entirely on your own infrastructure"
([docs.growthbook.io](https://docs.growthbook.io/)).

Licensing is dual: "The bulk of the code is under the permissive MIT license. There are several
directories that are governed under a separate commercial license, the GrowthBook Enterprise
License" ([github.com/growthbook/growthbook](https://github.com/growthbook/growthbook)).

Pricing ([growthbook.io/pricing](https://www.growthbook.io/pricing)) is seat-based, not
usage-based, with four relevant tiers:

- **Cloud — Starter (free)**: up to 3 users, 1 project, unlimited flags/experiments.
- **Cloud — Pro ($40/seat/month)**: up to 30 users, 3 projects, AI visual editor, multi-armed
  bandits, safe rollouts.
- **Cloud/Self-hosted — Enterprise (custom)**: SSO/SCIM, approval workflows, 99.99% SLA.
- **Self-hosted — Open Source (free)**: unlimited users, 1 project, bring your own data
  warehouse, community support only.

For a small nonprofit site, self-hosted OSS (free, unlimited users) is the natural starting point
unless the team wants managed hosting and is fine with the 3-user/1-project Cloud free tier.

## 2. SDK options for this stack

GrowthBook publishes ~24 official SDKs
([github.com/growthbook/growthbook](https://github.com/growthbook/growthbook)). Three are
relevant here:

- **`@growthbook/growthbook-react`** — for the React 19 islands (`client:only="react"`
  components). Wraps a `GrowthBook` instance in a `GrowthBookProvider` and exposes flags via
  hooks ([docs.growthbook.io/lib/react](https://docs.growthbook.io/lib/react)).
- **`@growthbook/growthbook`** (core JS/Node SDK) — usable server-side, including inside Astro's
  SSR request handler on the Cloudflare adapter, to fetch/evaluate flags before HTML is sent
  ([docs.growthbook.io/lib/js](https://docs.growthbook.io/lib/js)). The Node build shares the
  same package as the browser build.
- **Cloudflare Workers Edge SDK (`@growthbook/edge-cloudflare`)** — lives in the separate
  `growthbook/growthbook-proxy` monorepo, not `growthbook/growthbook`
  ([github.com/growthbook/growthbook-proxy](https://github.com/growthbook/growthbook-proxy)).
  Per that repo's README, the monorepo packages are: `@growthbook/proxy` (a standalone Node
  proxy server for caching/streaming/security), `@growthbook/proxy-eval` (remote-evaluation
  engine), `@growthbook/edge-utils` (framework-agnostic "Edge App" base, usable standalone or
  inside vendor-specific libs), and per-vendor wrappers `@growthbook/edge-cloudflare`,
  `@growthbook/edge-fastly`, `@growthbook/edge-lambda`. Per
  [docs.growthbook.io/lib/edge/cloudflare](https://docs.growthbook.io/lib/edge/cloudflare), this
  edge app is designed to run as its **own** Cloudflare Worker that intercepts the request before
  your origin (e.g. for URL-rewrite/redirect-style experiments), not as a library dropped inside
  an existing framework's SSR handler — that use case is a closer fit for the "Build Your Own"
  edge-app pattern (`@growthbook/edge-utils`) than a plug-and-play install alongside Astro's
  `@astrojs/cloudflare` adapter. **This needs a closer read of
  `packages/lib/edge-utils` and `packages/lib/edge-cloudflare` in
  `growthbook/growthbook-proxy`** before committing to it — it was only skimmed here, per the
  task scope ("skim, don't deep-dive").
- For this repo's shape (Astro SSR page → React island rendered `client:only`), the pragmatic
  starting point is the **core `@growthbook/growthbook` JS SDK run server-side** inside the
  `.astro` page (same tier as `fetchEvents()`/`fetchNotionFAQ()` in `src/store/`), passing the
  evaluated feature payload down as a prop to the client React SDK — see §4. The edge-app
  packages are a possible future optimization, not a prerequisite.

## 3. How the SDK connects to GrowthBook, and what that means for CSP

The core JS SDK's constructor takes an `apiHost` and `clientKey`
([raw README, `packages/sdk-js`](https://raw.githubusercontent.com/growthbook/growthbook/main/packages/sdk-js/README.md)):

```js
const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-abc123",
  decryptionKey: "key_abc123", // optional, only if payload encryption is enabled
  trackingCallback: (experiment, result, user) => { ... },
});
await gb.init();
```

- **Default API host is `https://cdn.growthbook.io`** (GrowthBook Cloud's CDN) — a self-hosted
  deployment would point `apiHost` at your own instance/proxy URL instead.
- **Fetching** is a plain `fetch`/XHR GET request against `apiHost` for the feature definitions
  keyed by `clientKey`; the SDK "manages the network requests, caching, retry logic, etc." for
  you (same README). There is no requirement to load GrowthBook via an inline `<script>` tag or
  a third-party `<script src>` — it's an npm package executed as ordinary bundled JS, same as any
  other dependency already in this codebase.
- **Live updates** default to a persistent **Server-Sent Events (SSE)** connection for background
  sync, and can be disabled with `backgroundSync: false` if only static feature loads are wanted
  (same `sdk-js` README).
- **Encrypted payloads**: since SDK v0.20.0, GrowthBook can serve the `/features` payload
  encrypted; the client decrypts it with a `decryptionKey`, using `SubtleCrypto` (the SDK notes
  Node < 18 needs a polyfill) (same README; capability matrix at
  [docs.growthbook.io/lib/js](https://docs.growthbook.io/lib/js)).
- **CSP implications**: because the SDK only does `fetch`/EventSource network calls to your
  configured `apiHost`, using it requires adding that host (either `cdn.growthbook.io` for
  Cloud, or your self-hosted API/proxy origin) to `connect-src` in
  `src/middleware/csp.ts` — nothing else. It does **not** require `unsafe-inline` or
  `unsafe-eval` on `script-src`/`style-src`, since the SDK is a regular bundled module with no
  inline `eval()`/`Function()` usage documented anywhere in the SDKs reviewed, and it renders no
  DOM/styles of its own. This means it should be fully compatible with this repo's strict
  nonce-based CSP as long as `connect-src` (and, for SSE, the same origin since `EventSource`
  follows `connect-src`) is updated — **no new script-src origin needs to be added** as long as
  the SDK ships as an npm dependency bundled by Astro/Vite rather than pulled from a CDN
  `<script src>` tag.
- GrowthBook's own security doc confirms the client-key/flag-rule surface is inherently public
  once shipped to a browser: "If you are using GrowthBook on the client side of your
  application, the rules about how each feature will be exposed to your users are publicly
  accessible by inspecting network requests"
  ([docs.growthbook.io/using/security](https://docs.growthbook.io/using/security)). It also
  states that even with payload encryption, "a malicious actor can see the decrypted payload"
  once it's decrypted client-side (same page) — encryption raises the bar slightly but is not a
  real secrecy boundary for logic evaluated in the browser. For anything sensitive, GrowthBook's
  documented alternative is **remote evaluation** (evaluate flags server-side only, ship the
  browser just the boolean/variant result, not the targeting rules) — this is also what the
  `growthbook-proxy` package's "Remote Evaluation" feature and `@growthbook/edge-utils` are for.

## 4. Avoiding flash of default content (SSR bootstrap pattern)

GrowthBook's documented pattern for SSR frameworks (shown for Next.js, but the shape is
framework-agnostic) is: fetch/evaluate the feature payload on the server, then hand it to the
client SDK instance as a bootstrap value so the first client render already has the right flags
— no flicker while waiting on the browser's own fetch
([`packages/sdk-react` README](https://raw.githubusercontent.com/growthbook/growthbook/main/packages/sdk-react/README.md)):

```js
// server-side
import { getGrowthBookSSRData } from "@growthbook/growthbook-react";

const gbData = await getGrowthBookSSRData({
  apiHost: process.env.GROWTHBOOK_API_HOST,
  clientKey: process.env.GROWTHBOOK_CLIENT_KEY,
  attributes: { id: userId },
});
```

```jsx
// client
const gb = new GrowthBook({ apiHost, clientKey });
gb.setPayload(gbData.payload); // or equivalent bootstrap prop
```

Mapped onto this repo's shape: a `.astro` page would call the core `@growthbook/growthbook` SDK
during SSR (same layer as `fetchEvents(Astro.locals)` in `src/store/eventsClient.ts`, per
[docs/EVENTS.md](EVENTS.md)) to fetch and evaluate the feature payload, then pass that payload as
a prop into the React component mounted with `client:only="react"`. Because `client:only`
components render nothing during SSR, the payload has to travel through the prop (serialized into
the initial HTML/hydration data), not through a DOM read — the React SDK's job on the client is
then just `gb.setPayload(payloadFromProps)` (or constructing `GrowthBook({ features: payload })`
directly) instead of waiting on its own network round trip. This mirrors the existing "server
fetches, client re-fetches only if no SSR data was passed" pattern already used by
`events.astro`/`Events.tsx` ([docs/EVENTS.md](EVENTS.md)).

## 5. Experiment tracking (`trackingCallback`)

`trackingCallback(experiment, result, user)` fires once per user each time they're placed into an
experiment ([search of docs.growthbook.io/lib/js and docs.growthbook.io/lib/php examples](https://docs.growthbook.io/lib/js)),
and since SDK v1.7.0 also receives a third `user` argument with attributes/URL context
([`packages/sdk-react` README](https://raw.githubusercontent.com/growthbook/growthbook/main/packages/sdk-react/README.md)):

```js
trackingCallback: (experiment, result, user) => {
  analytics.track("Experiment Viewed", {
    experimentId: experiment.key,
    variationId: result.key,
    attributes: user?.attributes,
  });
}
```

The callback body is entirely up to the integrator — GrowthBook doesn't mandate a vendor. Since
this repo has no forced analytics vendor (Plausible is used for conversion tracking per
[docs/DONATIONS.md](DONATIONS.md)), the callback would most naturally either (a) call
`window.plausible('Experiment Viewed', { props: { experimentId, variationId } })` if Plausible's
custom-events API is judged sufficient, or (b) POST to a small server-side endpoint under
`src/pages/api/` (consistent with this repo's pattern of proxying writes rather than calling
third parties directly from the client, per `CLAUDE.md`'s security model) that then forwards to
whatever analytics destination is chosen later.

## 6. Config / secrets

| Value | Purpose | Client-safe? |
| --- | --- | --- |
| `clientKey` (`sdk-...`) | Identifies which environment/project's flags to fetch | **Yes** — GrowthBook's own security docs treat client-key-gated flag/rule data as inherently visible to anyone inspecting network requests once shipped to a browser ([docs.growthbook.io/using/security](https://docs.growthbook.io/using/security)) |
| `apiHost` | Where to fetch features from (`https://cdn.growthbook.io` for Cloud, or a self-hosted/proxy URL) | Yes, it's just a URL |
| `decryptionKey` | Decrypts an encrypted `/features` payload | Ships to and is used by the browser, so it is **not a real secret** for client-side use — GrowthBook's docs are explicit that a malicious actor can still see the decrypted payload client-side ([docs.growthbook.io/using/security](https://docs.growthbook.io/using/security)); encryption is obfuscation against passive scraping, not a security boundary |
| Webhook secret (`ewhk_...`) | Verifies inbound GrowthBook webhook calls (e.g. cache-invalidation pings to a proxy/self-hosted API on flag changes), sent via an `X-GrowthBook-Signature` HMAC-SHA256 header | **Server-only, must stay secret** ([docs.growthbook.io/app/webhooks/event-webhooks](https://docs.growthbook.io/app/webhooks/event-webhooks)) |
| Self-hosted app env vars: `APP_ORIGIN`, `API_HOST`, `JWT_SECRET`, `ENCRYPTION_KEY`, `MONGODB_URI`, `LICENSE_KEY` | Configure a self-hosted GrowthBook instance itself (not the SDK) | Server-only, GrowthBook's own backend infra, not this website's runtime |

Cross-referencing this repo's `getEnv()` convention (`src/utils/getEnv.ts`, which resolves
Cloudflare runtime env → `import.meta.env` → `process.env`): `GROWTHBOOK_CLIENT_KEY` and
`GROWTHBOOK_API_HOST` would be safe to resolve via `getEnv()` and pass through to the client
bundle (they're meant to be public), matching how this repo already treats `EVENTS_ICS_URL` as
the one exception that must stay server-only ([docs/EVENTS.md](EVENTS.md) — note `EVENTS_ICS_URL`
is *not* a template for GrowthBook's client key, which is opposite in sensitivity). Only a
webhook secret used for cache invalidation (if a self-hosted GrowthBook + proxy setup is chosen)
would need the same server-only treatment this repo already applies to `NOTION_SECRET` and other
true secrets, verified with `constantTimeEqual()` from `src/utils/crypto.ts` per the existing
webhook-auth convention in `CLAUDE.md`.

## Open items not resolved by this research pass

- Whether to self-host GrowthBook (free, unlimited users, requires running/maintaining Mongo +
  the GrowthBook app) or use GrowthBook Cloud's free tier (3 users/1 project cap).
- Whether SSR bootstrapping (§4) is worth the added server-side fetch on every page load, versus
  accepting a brief client-side flicker for a lower-traffic nonprofit site.
- Whether the Cloudflare edge-app packages (`@growthbook/edge-cloudflare` /
  `@growthbook/edge-utils` in `growthbook/growthbook-proxy`) are worth a deeper look for
  redirect/rewrite-style experiments, given they weren't designed as a drop-in library for an
  existing Astro/Cloudflare-adapter SSR handler — this was only skimmed per task scope.

## Client vs. server flag evaluation: what's recommended

**1. GrowthBook's own framework guidance.** GrowthBook's Next.js guides
([App Router](https://docs.growthbook.io/guide/nextjs-app-router),
[Pages Router](https://docs.growthbook.io/guide/nextjs-and-growthbook)) show the SSR-bootstrap
pattern as the documented default for that framework: fetch the feature payload server-side and
hand it to the client SDK via `initSync`/`setPayload` so "the markup is already correct before
React touches it" — the stated principle is to "decide the variant before the HTML leaves the
server." This is framework-specific guidance, not a blanket rule; GrowthBook has no published
Astro guide, and the React SDK docs
([docs.growthbook.io/lib/react](https://docs.growthbook.io/lib/react)) present the plain
client-fetch flow as the base case, with SSR bootstrapping layered on top only where a framework
guide exists. There's no single "always do X" statement — GrowthBook's docs consistently frame it
per use case (does this flag affect what's visible on first paint?).

**2. Tradeoffs GrowthBook itself draws out.** The clearest explicit tradeoff statement in
GrowthBook's docs is on the Cloudflare edge page
([docs.growthbook.io/lib/edge/cloudflare](https://docs.growthbook.io/lib/edge/cloudflare)), which
frames edge evaluation as existing specifically to "cut flicker before HTML ships" — i.e., it's
positioned as the fix when both plain client-fetch (flicker) and full app-server SSR bootstrap
(a fetch added to every origin request) are unattractive. The Cloudflare/Fastly/Lambda@Edge
edge-app packages intercept the request *before* it reaches your origin, so their sweet spot is
edge-native use cases — URL redirect/rewrite experiments and personalization baked into the very
first response — not general app SSR. GrowthBook doesn't publish a quantified latency comparison
between the three approaches; the qualitative shape is: client-only fetch = zero server cost, risk
of flicker; SSR bootstrap = no flicker, but every server-rendered request now waits on a feature
fetch (mitigated by the SDK's own caching/CDN payload, not eliminated); edge evaluation = no
flicker without touching the origin server, at the cost of standing up and maintaining a separate
edge worker outside the existing Astro/Cloudflare adapter request path (per this repo's own
research in §2, it's not a drop-in library call — it's its own Worker).

**3. Industry consensus.** Other vendors converge on the same shape GrowthBook implies. Vercel's
Flags SDK docs are the most direct: client-side flag evaluation causes users to see "a loader, a
flicker, or a layout shift because the browser can't render the correct view until the flag value
comes back," and their fix is evaluating server-side (in RSC, `await`ed during render) so "the
browser renders it directly, with no separate flag request"
([Using the Flags SDK](https://vercel.com/docs/flags/vercel-flags/sdks/flags-sdk),
[Vercel Flags](https://vercel.com/docs/flags/vercel-flags)) — going further with a "Precompute"
pattern for fully static pages. LaunchDarkly's bootstrapping docs
([Bootstrapping](https://launchdarkly.com/docs/sdk/features/bootstrapping),
[Eliminating flicker when using default flag values](https://launchdarkly.com/docs/sdk/client-side/javascript/default-values))
frame server-computed bootstrap values as the answer to flicker specifically "while running
experiments" so users aren't exposed to a wrong variant momentarily — but LaunchDarkly does not
say every client app must bootstrap; the plain client SDK with sensible default values is treated
as an acceptable baseline for flags that don't gate visible UI. The rough industry consensus is:
**bootstrap/evaluate server-side when you're already doing SSR and the flag controls
above-the-fold or layout-affecting content; a plain client fetch is fine otherwise, and nobody
recommends solving flicker before it's an observed, visible problem.**

**4. Recommendation for this site.** Ship the already-installed client-only
`@growthbook/growthbook-react` approach and revisit if a specific flag later causes a visible
flicker. Reasoning: this is a low-traffic nonprofit site with **zero flags live**, so there is no
concrete above-the-fold flag yet to justify server cost; Astro's own SSR handler doing an extra
network round-trip to GrowthBook on every page request is a real latency cost applied to 100% of
traffic today, in exchange for fixing a flicker problem that doesn't exist yet. Once real flags
are built and one of them visibly gates layout/above-the-fold content (the same test GrowthBook
and Vercel both use), that specific page is the right place to add SSR bootstrapping (§4 above),
not the whole site up front. The edge-worker approach is unlikely to be worth it for this project
at all — it's built for redirect/rewrite-at-the-edge use cases and would add a second piece of
infrastructure to maintain, which doesn't match a small-nonprofit low-traffic profile with no
edge-specific experiment need.
