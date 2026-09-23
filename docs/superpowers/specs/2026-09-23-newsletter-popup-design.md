# Homepage Newsletter Popup — Design

**Date:** 2026-09-23
**Status:** Agreed in brainstorming; implementation plan at `docs/superpowers/plans/2026-09-23-newsletter-popup.md`

## Goal

Grow the T4P mailing list by showing homepage visitors a small, dismissible signup card, and measure how many signups it drives versus the existing bottom-of-page form.

## Decisions (and why)

| Decision | Choice | Why |
|---|---|---|
| Form | The **same** EmailOctopus form `19239af2-f79d-11ef-b1dc-d39ed3d42a2b` as the bottom "Mailing list" section | Requested: one form to manage in EmailOctopus. |
| Two copies on one page | Popup copy lives in a same-origin **iframe** (`/newsletter-embed`) | EmailOctopus's embed script uses `document.querySelector` for its `<script data-form>` and `<form>`, so a second copy in the same document binds to the first. An iframe gives the popup copy its own `document`. |
| On/off switch | GrowthBook feature flag `homepage-newsletter-popup` (boolean, default `false`) | Turn on/off without a deploy. No GrowthBook data source, no experiment. |
| Measurement | Plausible custom events (cookieless) | Avoids a persistent visitor ID, and therefore a consent banner. GrowthBook managed warehouse was rejected for that reason. |
| Trigger | 10 s on page **or** 35% scroll, whichever first | Research: 8–15 s delay and ≥35% scroll perform best; homepage avg scroll depth is only ~42% desktop / ~36% mobile, so scroll-only would miss half of visitors. |
| Never shown when | The bottom `#mailing-list` section is in view; dismissed < 30 days ago; subscribed via popup | No two forms on screen at once; respect dismissals. |
| Re-show after dismiss | 30 days | Common 7–30 day range; nonprofit ask, frequent returning visitors. |
| Desktop (≥768px) | Bottom-right card, above the pal-chat launcher | Non-blocking; Layout notes pal-chat owns the bottom corners. |
| Mobile (<768px) | Slim "Get T4P updates →" bar that expands into the card | Google intrusive-interstitial guidance: small, dismissible banners only. |
| Copy | EmailOctopus form as-is (heading "Join our Mailing List") | Requested. |
| Storage | `localStorage["t4p-newsletter-popup"]` = `{"dismissedAt": <ms>}` or `{"subscribed": true}` | Remembers a UI choice only, no identifier. Disclosed under "Functional Cookies" in the privacy policy. |

## Plausible events

| Event | Props | Fired when |
|---|---|---|
| `Newsletter Popup Shown` | — | Card (desktop) or bar (mobile) first appears in a page view |
| `Newsletter Popup Dismissed` | — | Visitor closes it without having subscribed |
| `Newsletter Signup` | `source: "popup"` or `source: "footer"` | EmailOctopus success message appears in that form |

The three goals are created in the Plausible dashboard by a human after deploy.

## Security

- `/newsletter-embed` is frameable by our own origin only: `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`. Every other HTML page gets `frame-ancestors 'none'` + `X-Frame-Options: DENY`.
  - Today `public/_headers` sends `X-Frame-Options: DENY`, but Cloudflare does not apply `_headers` to Pages Functions responses, and every page here is SSR. So HTML pages currently have **no** framing protection. Setting it in the CSP middleware closes that gap.
- `frame-src` gains `'self'` so the homepage may load the iframe.
- `postMessage` in both directions is pinned to `window.location.origin`; the parent also checks `event.source === iframe.contentWindow` and validates the payload shape.
- No `style=""` attributes; the iframe height is set through CSSOM (`el.style.height`), which CSP allows.
- `/newsletter-embed` is `noindex`, excluded from the sitemap, and loads no Plausible (so it does not count as a pageview).

## Out of scope

Consent banner, GrowthBook experiment/data source, a second EmailOctopus form, changing the bottom form, fixing the stale "Google Analytics" wording in the privacy policy.
