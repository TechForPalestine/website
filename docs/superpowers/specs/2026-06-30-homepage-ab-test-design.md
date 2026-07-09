# Homepage A/B Test Design

**Date:** 2026-06-30  
**Status:** Approved  
**Scope:** Homepage only (`/` vs `/home-new`)

---

## Goal

Run a controlled A/B test comparing the current homepage design (control) against the new redesigned homepage (variant), starting with a single page to keep variables isolated before rolling out to other sections.

---

## Approach

**Option chosen:** Client-side anti-flicker inline script with localStorage for sticky assignment.

**Why:**
- PECR compliance — localStorage is not a cookie; no consent banner required under UK law
- Consistent with existing A/B test patterns in the codebase (`donate-new.astro`, `MembershipPage.tsx`)
- No infrastructure changes — no middleware, no Cloudflare Workers, no new dependencies

---

## Flow

```
User visits /
  └── Sync <script> in <head> runs before first paint
        ├── localStorage has 'ab-homepage-variant'?
        │     ├── yes → use existing assignment (sticky)
        │     └── no  → Math.random() < 0.5 ? 'control' : 'variant'
        │               └── store in localStorage
        └── variant === 'variant'?
              ├── yes → location.replace('/home-new')
              └── no  → render / normally

Both / and /home-new
  └── Plausible custom event fires on load:
        plausible('ab-homepage', { props: { variant: 'control' | 'new' } })
```

---

## Assignment Properties

| Property | Value |
|---|---|
| localStorage key | `ab-homepage-variant` |
| Possible values | `control`, `variant` |
| Split | 50/50 (`Math.random() < 0.5`) |
| Persistence | Until localStorage is cleared |
| Private/incognito | Re-randomised each session (acceptable) |

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| User lands on `/about` first, then `/` | Assigned on first visit to `/` — correct |
| User lands directly on `/home-new` | Sees new design unassigned; assigned on next `/` visit |
| `control` user navigates manually to `/home-new` | Sees new design — acceptable edge case, negligible statistical impact |
| JS disabled | Always sees control (no redirect fires) |

---

## Tracking

Plausible Analytics is already set up. Variant exposure is recorded via a custom event on both pages:

```js
window.plausible('ab-homepage', { props: { variant: 'control' } })
// or
window.plausible('ab-homepage', { props: { variant: 'new' } })
```

In the Plausible dashboard: create a custom event goal named `ab-homepage`, then filter by the `variant` property to compare engagement between groups.

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/index.astro` | Add anti-flicker `<script>` in `<head>` + Plausible tracking script |
| `src/pages/home-new.astro` | Add Plausible tracking script for `variant: 'new'` |

No middleware changes. No new dependencies. `astro.config.mjs` sitemap exclusion for `/home-new/` stays — it is not a canonical page during the test.

---

## Ending the Test

When the test concludes:

1. Remove the anti-flicker script from `src/pages/index.astro`
2. If variant wins: replace `src/pages/index.astro` content with `home-new`, add `301` redirect from `/home-new` to `/` in `public/_redirects`, remove `/home-new/` from sitemap exclude list
3. If control wins: delete `src/pages/home-new.astro`, add `301` redirect from `/home-new` to `/`
4. Clear `ab-homepage-variant` from localStorage is optional (it will self-expire naturally as users clear storage)

---

## Out of Scope

- Other `-new` pages (about, team, events, etc.) — tested separately in future iterations
- Server-side routing or Cloudflare Workers
- Cookie consent / GDPR banners
