# Homepage Hero Photo A/B Test Design

**Date:** 2026-11-25
**Status:** Approved (2026-11-25)
**Scope:** The hero photo on `/` (four variants), plus a hero copy font fix shipped first.

---

## Why

The team wants to know which hero photo on the homepage gets visitors to engage and to move on to
the pages that matter: `/membership`, `/volunteer`, `/projects` and `/incubator`. The current
photo (children in Gaza, © Motaz Azaiza) is tested against three photos of T4P members at events.
Target: 500–1,000 views per photo.

## Goals

- Each homepage visitor sees one of four photos, chosen at random, 25% each.
- A visitor keeps the same photo for the whole day (reloads and returning to `/` included), so
  session measures belong to one photo.
- Per photo, in Plausible: bounce rate, scroll depth, time on page, and clicks from the homepage
  to `/membership`, `/volunteer`, `/projects` and `/incubator`.
- The test can be switched off and the split changed in GrowthBook, with no deploy.

## Non-goals

- Statistical analysis inside GrowthBook. GrowthBook only assigns the photo; it has no access to
  Plausible data. Results are read in Plausible.
- Testing anything else on the page (copy, CTAs, layout) at the same time.
- Changing the social share image (`og:image` stays `happy-kids.jpg`).

## Anti-goals (a failure even if it "works")

- The old photo flashes before the variant (no client-side swapping).
- Anything stored on the visitor's device (no cookies, no localStorage): the site has no consent
  banner and the existing tests are built to not need one.
- A slower homepage: only the assigned photo is downloaded, still with `fetchpriority="high"`.
- Misleading results from mixed exposure: a visitor counted under two photos in one session.

## Constraints

- Astro SSR on Cloudflare Pages; CSP forbids inline `style=""` attributes and `'unsafe-inline'`
  (`src/middleware/csp.ts`). Per-photo crop position must use Tailwind classes, not inline styles.
- `/` is served `Cache-Control: private, max-age=600` (`src/middleware/cache-control.ts`): not
  cached by the CDN, so server-side assignment per request is safe.
- Homepage traffic: 8,074 visitors / 8,727 visits in the last 30 days (≈270 visitors a day).

## Approaches considered

| Approach                                                                                                                                                                                                            | Trade-off                                                                                                                                             | Decision    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **A. Server-side, same photo all day.** Reuse the nav test's daily cookieless id (`requestAssignmentId` in `src/lib/navAssignment.ts`: HMAC of UTC date, IP, User-Agent) and evaluate a GrowthBook flag during SSR. | Clean per-photo sessions; no flicker, nothing stored. Needs `NAV_ASSIGNMENT_SECRET` (already set in production). No assignment in `pnpm dev` (no IP). | **Chosen.** |
| B. Server-side, new random id per request (the old homepage-description test).                                                                                                                                      | Simpler, but a visitor going `/` → `/projects` → `/` can see two photos in one visit, which pollutes bounce rate and time on page.                    | Rejected.   |
| C. Client-side GrowthBook SDK with localStorage.                                                                                                                                                                    | Photo flicker on the largest element of the page, slower LCP, device storage.                                                                         | Rejected.   |

## Design

### 0. Font fix (separate PR, ships before the test starts)

In `src/pages/index.astro`, the "These projects include…" paragraph changes from
`text-[17px] … min-[810px]:text-[18px]` to `text-[19px] … min-[810px]:text-[21px]`, matching the
"Tech for Palestine is a member-driven organization…" paragraph above it. Shipping it first keeps
the page identical across all four arms.

### 1. The photos

| Variant value | Photo                                                   | Source                              |
| ------------- | ------------------------------------------------------- | ----------------------------------- |
| `control`     | Children in Gaza (current)                              | `public/happy-kids-{800,1600}.webp` |
| `speaker`     | Speaker reading to a seated group, map tapestry behind  | 1920×1282 PNG                       |
| `laptops`     | Three people working at laptops with Palestine stickers | 1920×1193 PNG                       |
| `stage`       | Two people on stage between Thaura and T4P banners      | 1920×1078 PNG                       |

The three source PNGs are currently in the session scratchpad
(`/tmp/claude-1000/-home-magnus-Desktop-t4p-website/addd46b2-e985-4c03-93ba-2b792996c213/images/{2,3,4}.png`
= speaker, laptops, stage); they must be copied into the repo or converted from there before
that directory is cleared.

Each new photo becomes `public/images/hero/<variant>-800.webp` and `-1600.webp`, matching the
current photo's `srcset`/`sizes`. Each variant's data (src, srcset, alt, credit, crop class)
lives in one typed record next to the experiment helper, not inline in the page.

**Cropping.** On desktop (`lg`), the hero image fills the right half of a near-viewport-tall
section, so roughly a square slice of each landscape photo shows. Per-photo `object-position`
(Tailwind classes, e.g. `object-[50%_40%]`):

- `speaker`: centre, the speaker is mid-frame.
- `laptops`: centred on the woman in the middle; the people at the edges are partly cropped.
- `stage`: centred between the two people; most of both banners is cropped out.

On phones the hero is full width and `h-[min(26rem,45vh)]` tall, which on a typical phone
(390×844) is about 390×380: close to square too. So each photo gets two crop positions, one for
phones and one from `lg` up (e.g. `object-[45%_50%] lg:object-[50%_40%]`), each checked on
the real viewport.

**Consent:** the team has confirmed the people shown are happy to appear on the homepage.

**Alt text:**

- `speaker`: "A man reads from a sheet of paper to a seated group, with an embroidered map of
  Palestine hanging on the wall behind him"
- `laptops`: "Three people work together at laptops covered in Palestinian flag and watermelon
  stickers"
- `stage`: "Two people on stage applaud between a Thaura banner and a Tech for Palestine banner"

**Still to come from the team (blocks launch, not the build):** a photographer credit for each
new photo. The build uses a clearly marked `TODO` placeholder until then.

### 2. Assignment (GrowthBook, server-side)

- New GrowthBook feature `homepage-hero-photo`, string type, default `control`, with an
  **Experiment rule** of four variations `control | speaker | laptops | stage`, 25% each, hashed
  on the `id` attribute.
- In `index.astro` frontmatter: load the payload (`loadFeaturePayload`), get the visitor id
  (`requestAssignmentId`), evaluate (`evalServerFeature`). Nothing new in `growthbookServer.ts`.
- A visitor counts as assigned only when the result's `source` is `"experiment"` and the value is
  one of the four variants. This differs from the nav test (`"force"`), because that test used a
  rollout rule. Anything else (flag off, flag missing, CDN down, no id in `pnpm dev`) shows
  `control` and sends **no** experiment data.
- GrowthBook hashes each experiment with its own seed, so the daily id gives independent buckets
  for this test and any other test that uses it.

### 3. Measurement (Plausible)

- **Variant on the pageview.** For assigned visitors, the homepage pageview itself carries a
  custom property `hero_photo=<variant>`. Then bounce rate, scroll depth and time on page can be
  filtered per photo in Plausible with no extra event. Mechanism (my call): `Layout.astro` gains an
  optional prop for pageview custom properties, passed into the existing
  `plausible.init({ endpoint: "/api/pipe", … })` call as `customProperties`. Unassigned visitors
  get no property.
- **Clicks.** One event, `Homepage Link Click`, props `{ hero_photo, destination }`, with
  `destination` one of `/membership`, `/volunteer`, `/projects`, `/incubator`. One delegated
  click listener on the homepage (catches nav, body, footer and the mobile menu that renders on
  demand), matching on the link's pathname (trailing slash and query string ignored; same-origin
  links only) against exactly those four paths; every other link (`/get-involved`,
  `/community-call`, popup links, external) is ignored. Middle-clicks count, like the nav test.
  Only sent for assigned visitors. The homepage body links to `/membership` and `/projects`;
  `/volunteer` and `/incubator` are reachable from the nav and footer.
- **Prerendering.** Every Layout page prerenders `/` via speculation rules. The click listener
  needs no exposure event. The pageview is Plausible's own; the preview check (step 2 of
  Running the test) confirms it is held until the page is actually shown.
- **Engagement events.** Scroll depth and time on page come from Plausible's engagement events,
  which must carry the same `hero_photo` property as the pageview. The preview check confirms
  this in the network payload. If they don't, the builder adds a fallback: one non-interactive
  `Homepage Engagement` event sent on `pagehide`, with bucketed props (`scroll`: `0-25`,
  `25-50`, `50-75`, `75-100`; `seconds`: `0-10`, `10-30`, `30-60`, `60+`), and the team is told
  that scroll depth and time on page are read as bucket distributions.

### What Plausible does with property filters (checked against live data, 2026-11-25)

Using the nav test's `variant` property (sent only on `Nav Label Shown`/`Nav Label Click`
events) over the last 30 days:

- **Session metrics filter by session.** Filtering by `variant=B` returns bounce rate and visit
  duration for all visits that contained a matching event (13,296 visits, bounce rate 0%). So
  per-photo bounce rate works as long as the homepage pageview carries `hero_photo`.
- **Goals filter by event.** The same filter returns only goals whose own events carry the
  property (`Nav Shown B`, `Nav Click B`, `Signup B`, `Membership-complete`). Page goals such as
  `Visit /membership` drop out. This is why clicks need their own `Homepage Link Click` event
  carrying `hero_photo`: the existing page goals cannot be split by photo.
- **Scroll depth and time on page filter by event.** Filtering `/` by `variant=B` returns
  `null` for both, because the property is not on the pageview or engagement events. Putting
  `hero_photo` in `customProperties` (which the docs say attaches to every event the script
  sends) is what makes them work; the preview check confirms it.

Sources: Plausible docs on [pageview properties](https://plausible.io/docs/custom-props/for-pageviews),
[`interactive: false`](https://plausible.io/docs/custom-event-goals) (custom events are
interactive by default and remove the visit from the bounce count) and
[property setup](https://plausible.io/docs/custom-props/props-dashboard) (each property must be
added under Site settings → Custom Properties before it shows in the dashboard). Plausible does
not document how it treats prerendered pages; the preview check covers it.

### Baseline (visitors who entered on `/`, last 30 days)

4,032 visitors. Of these, 13% reached `/projects`, 11% `/membership`, 6% `/incubator*` and
6% `/volunteer`. `Nav Label Shown` fired for 82% of them and `Newsletter Popup Shown` for 25%,
which is why the homepage bounce rate reads 3%.

With ~950 visitor-days per photo, a photo has to move `/membership` reach from about 11% to
about 15% (a third more) to show up as a clear difference from the control. The `/volunteer`
and `/incubator` measures, at around 6%, will only show a difference if a photo changes them a lot.

- **Plausible setup (manual):** add `Homepage Link Click` as a custom-event goal and add
  `hero_photo` under Site settings → Custom Properties (`destination` is already registered).
  With `hero_photo` in `customProperties`, the click event carries it automatically; the
  listener only adds `destination`.

### 4. Bounce-rate fix (site-wide)

Plausible counts every custom event as an interaction. These events fire without the visitor
doing anything, so they currently stop visits counting as bounces (the homepage shows a 3% bounce
rate):

- `Newsletter Popup Shown` (`src/components/home/NewsletterPopup.tsx`)
- `Challenge Popup Shown` (`src/components/home/ChallengePopup.astro`)
- `Report Popup Shown` (`src/components/home/ReportPopup.astro`)
- `Nav Label Shown` (`src/utils/navLabelExperiment.ts`)
- `Donate Form` on page load (`src/pages/donate.astro`, `src/pages/donate-2.astro`) (my call:
  included, since the fix is meant to be site-wide)

Each is sent with `interactive: false`. Side effect, to be told to the team in the PR: bounce
rate across the site (including `/donate`) will rise from the deploy date, so comparisons with
earlier periods are no longer like for like.

### 5. Running the test

1. Ship the font fix.
2. Ship the bounce-rate fix and the experiment code with the flag **off**. Verify in a production
   or Cloudflare preview deploy (not `pnpm dev`): with the flag on for a test, each photo renders,
   the pageview has `hero_photo`, and clicks send the event.
3. The nav test (`nav-get-involved-label`) is already switched off in GrowthBook, so the nav is
   the same for every visitor during this test. Its code stays for now; `Nav Label Shown` still
   gets `interactive: false` in case it is switched on again.
4. Start a test period of **14 full days** (≈950 visitor-days per photo at current traffic).
   Counts are visitor-days, since the id rotates daily.
5. Read the results in Plausible: filter by `hero_photo`, compare bounce rate, scroll depth and
   time on page on `/`, and `Homepage Link Click` per variant and destination. With ~950 per
   arm, expect to detect only large differences; small differences in scroll depth or time on
   page will be noise. Known small leak: the id rotates at UTC midnight (evening in the
   Americas), so a visit spanning midnight can see two photos; mention it in the write-up.
6. Turn the flag off, hard-code the winner (`control` if no clear winner), remove the experiment
   code and unused images, and record the result. If the nav test is also gone by then, update
   the comment in `src/middleware/cache-control.ts` that gives it as the reason pages are
   `private`.

### 6. Tests

Vitest, colocated, in the style of `navLabelExperiment.test.ts`:

- variant-from-feature: accepts only `source: "experiment"` with a known value; everything else
  is unassigned.
- click tracking: each of the four destinations (with trailing slash, query string, absolute
  same-origin URL), ignores other links and other origins, middle-click counts, right-click
  doesn't, unassigned visitors send nothing.
- the `interactive: false` option on the four load-time events.

## Left to the builder

- File and function names, and where the variant record lives.
- Exact `object-position` values per photo, judged on a desktop and a phone viewport.
- WebP quality settings (match the existing `happy-kids-*.webp` file sizes roughly).
- How `Layout.astro` passes the pageview properties to `plausible.init`, within the CSP rules.
