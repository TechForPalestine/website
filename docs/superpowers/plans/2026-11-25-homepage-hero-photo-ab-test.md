# Homepage Hero Photo A/B Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each homepage visitor one of four hero photos (same photo all day, chosen by GrowthBook on the server) and measure bounce rate, scroll depth, time on page and clicks to `/membership`, `/volunteer`, `/projects`, `/incubator` per photo in Plausible.

**Architecture:** `index.astro` evaluates a new GrowthBook flag `homepage-hero-photo` during SSR with the existing daily cookieless id (`requestAssignmentId`), renders the assigned photo, and passes `hero_photo` to `Layout.astro`, which emits it in a `<meta>` that the Plausible `init()` reads as `customProperties`. A delegated click listener sends `Homepage Link Click`. Separately, load-time Plausible events become `interactive: false` so bounce rate is real.

**Tech Stack:** Astro 5 SSR on Cloudflare Pages, `@growthbook/growthbook`, Plausible (new `pa-*.js` script with `plausible.init`), Vitest (node env), ImageMagick (`magick`) for WebP conversion.

**Spec:** `docs/superpowers/specs/2026-11-25-homepage-hero-photo-ab-test-design.md`

## Global Constraints

- Package manager `pnpm`; never `npx astro`, never regenerate `package-lock.json`.
- No inline `style=""` attributes and no `'unsafe-inline'` (CSP, `src/middleware/csp.ts`). Crop positions are Tailwind arbitrary classes.
- Nothing stored on the visitor's device: no cookies, no localStorage, no client-side variant choice.
- Unassigned visitors (flag off/missing, CDN down, no id in `pnpm dev`) see `control` and send **no** `hero_photo` property and **no** `Homepage Link Click` event.
- Flag key `homepage-hero-photo`; variant values exactly `control`, `speaker`, `laptops`, `stage`; Plausible property `hero_photo`; event `Homepage Link Click` with prop `destination` ∈ `/membership`, `/volunteer`, `/projects`, `/incubator`.
- Assigned only when GrowthBook's result `source === "experiment"` and the value is a known variant.
- Only the assigned photo is downloaded; it keeps `fetchpriority="high"` and `decoding="async"`.
- Do not start a dev server or curl pages (user verifies in a preview deploy). Run `pnpm prettier --write` only on files you changed, never repo-wide.
- Commits: conventional format with a scope (`feat(home):`, `fix(analytics):`, …), ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Link shapes:** `/membership/`, `/projects?x=1`, `/volunteer#top`, `https://techforpalestine.org/incubator` must count; `/incubator-guide`, `/membership/supporting`, `https://other.org/projects`, `mailto:`, `javascript:` must not, and none may throw. (Task 5)
- **Click target inside the link:** a click on a `<span>`/`<img>` inside the `<a>` counts once. (Task 5)
- **Mouse buttons:** middle-click counts, right-click (`auxclick` button 2) does not. (Task 5)
- **GrowthBook unavailable:** missing payload, flag missing, flag off, unknown value, or `source` other than `"experiment"` → `null` → control photo, no meta, no listener. (Task 4)
- **Malformed analytics meta:** missing meta, invalid JSON, a JSON array, or non-string values → `{}` or only the string entries; never throws, so Plausible init always runs. (Task 2)

---

### Task 1: Hero copy font size (own branch, ships first)

**Files:**

- Modify: `src/pages/index.astro` (the "These projects include…" `<p>`, currently `mt-3 max-w-[58ch] text-[17px] leading-[1.6] text-ink-secondary min-[810px]:text-[18px]`)

**Interfaces:** none.

- [ ] **Step 1: Branch from `main`:** `git checkout -b fix/home-hero-copy-size`
- [ ] **Step 2: Change the classes** to `text-[19px]` and `min-[810px]:text-[21px]` (matching the paragraph above); keep `mt-3`, `max-w-[58ch]`, `leading-[1.6]`, `text-ink-secondary`.
- [ ] **Step 3: Verify:** `pnpm lint` → no errors.
- [ ] **Step 4: Commit:** `fix(home): match the hero's second paragraph to the first's font size`
- [ ] **Step 5: Start the feature branch on top of it:** `git checkout -b feat/home-hero-photo-test` (Tasks 2–6 go here; its PR is stacked on this one).

### Task 2: Pageview custom properties from Layout

**Files:**

- Create: `src/utils/analyticsProps.ts`
- Test: `src/utils/analyticsProps.test.ts`
- Modify: `src/layouts/Layout.astro` (`Props`, `<head>`, the `plausible.init({ endpoint: "/api/pipe" })` script)

**Interfaces:**

- Produces: `ANALYTICS_PROPS_META = "t4p:analytics-props"`; `readAnalyticsProps(doc: Pick<Document, "querySelector">): Record<string, string>`; Layout prop `analyticsProps?: Record<string, string>`.

- [ ] **Step 1: Write the failing tests** (fake `doc` whose `querySelector` returns `{ getAttribute: () => content }` or `null`):

```ts
describe("readAnalyticsProps", () => {
  it("returns {} when there is no meta", () =>
    expect(readAnalyticsProps(docWith(null))).toEqual({}));
  it("parses a JSON object of strings", () =>
    expect(readAnalyticsProps(docWith('{"hero_photo":"speaker"}'))).toEqual({
      hero_photo: "speaker",
    }));
  it("returns {} for invalid JSON", () => expect(readAnalyticsProps(docWith("{nope"))).toEqual({}));
  it("returns {} for a JSON array", () => expect(readAnalyticsProps(docWith('["a"]'))).toEqual({}));
  it("drops non-string values", () =>
    expect(readAnalyticsProps(docWith('{"a":"x","b":1,"c":null}'))).toEqual({ a: "x" }));
});
```

- [ ] **Step 2: Run:** `pnpm vitest run src/utils/analyticsProps.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement `readAnalyticsProps`** — selects `meta[name="t4p:analytics-props"]`, reads `content`, `JSON.parse` in try/catch, keeps only string-valued own keys of a plain object.
- [ ] **Step 4: Run** the same command → PASS.
- [ ] **Step 5: Wire Layout.** Add `analyticsProps?: Record<string, string>` to `Props` (JSDoc: "Custom properties for this page's Plausible pageview and every later event on it"). When non-empty, render `<meta name="t4p:analytics-props" content={JSON.stringify(analyticsProps)} />` in `<head>` **before** the analytics scripts. In the init script, import `readAnalyticsProps` and call `init({ endpoint: "/api/pipe", customProperties: readAnalyticsProps(document) })`.
- [ ] **Step 6: Verify:** `pnpm test && pnpm lint` → pass.
- [ ] **Step 7: Commit** (also add the spec and this plan, `docs/superpowers/specs/2026-11-25-homepage-hero-photo-ab-test-design.md` and `docs/superpowers/plans/2026-11-25-homepage-hero-photo-ab-test.md`): `feat(analytics): let a page add custom properties to its Plausible pageview`

### Task 3: Load-time events stop cancelling bounces

**Files:**

- Modify: `src/utils/navLabelExperiment.ts` (+ `src/utils/navLabelExperiment.test.ts`)
- Modify: `src/components/home/NewsletterPopup.tsx:135`, `src/components/home/ChallengePopup.astro` (`track` helper + `"Challenge Popup Shown"` call), `src/components/home/ReportPopup.astro` (`track` helper + `"Report Popup Shown"` call), `src/pages/donate.astro:338`, `src/pages/donate-2.astro:190`
- Modify: `src/lib/navAssignment.ts` (warning text only)

**Interfaces:**

- Produces: `TrackEvent = (name: string, props: Record<string, string>, options?: { interactive?: boolean }) => void` in `navLabelExperiment.ts`.

- [ ] **Step 1: Write the failing test** in `navLabelExperiment.test.ts`: `trackNavLabel` calls `track(EXPOSURE_EVENT, props, { interactive: false })`, and a click calls `track(CLICK_EVENT, props)` with **no** options (clicks stay interactive). Update existing exposure assertions accordingly.
- [ ] **Step 2: Run:** `pnpm vitest run src/utils/navLabelExperiment.test.ts` → FAIL.
- [ ] **Step 3: Implement:** extend `TrackEvent`; `trackWithPlausible` forwards `interactive` when given; exposure passes `{ interactive: false }`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Update the other load-time calls** to send `interactive: false`: `plausible("Newsletter Popup Shown", { interactive: false })`; in Challenge/Report popups give `track` an optional third `options` argument merged into the call, and pass `{ interactive: false }` only from the `…Popup Shown` calls (CTA/dismiss events stay interactive); both `Donate Form` calls add `interactive: false` beside their existing `props`. If `window.plausible`'s type rejects `interactive`, widen it in `src/env.d.ts`.
- [ ] **Step 6: Warning text:** in `requestAssignmentId`, change the message to `` `${ASSIGNMENT_SECRET_ENV} is not set: server-side A/B tests are inactive` ``; update `docs/ENVIRONMENT.md`'s `NAV_ASSIGNMENT_SECRET` row to say it keys the daily visitor hash for the nav and homepage hero photo tests.
- [ ] **Step 7: Verify:** `pnpm test && pnpm lint && pnpm check` → pass.
- [ ] **Step 8: Commit:** `fix(analytics): send load-time events as non-interactive so bounce rate is real` (body: site-wide bounce rates, including `/donate`, will rise from this deploy).

### Task 4: Photos, variant record and server assignment

**Files:**

- Create: `public/images/hero/{speaker,laptops,stage}-{800,1600}.webp`
- Create: `src/utils/heroPhotoExperiment.ts`, `src/lib/heroPhotoAssignment.ts`
- Test: `src/utils/heroPhotoExperiment.test.ts`, `src/lib/heroPhotoAssignment.test.ts`

**Interfaces:**

- Consumes: `requestAssignmentId(request, locals, now?)` from `src/lib/navAssignment.ts`; `loadFeaturePayload`, `evalServerFeature` from `src/lib/growthbookServer.ts`.
- Produces (in `heroPhotoExperiment.ts`): `HERO_PHOTO_EXPERIMENT = "homepage-hero-photo"`; `type HeroPhotoVariant = "control" | "speaker" | "laptops" | "stage"`; `interface HeroPhoto { src: string; srcset: string; width: number; height: number; alt: string; credit: string; position: string }`; `HERO_PHOTOS: Readonly<Record<HeroPhotoVariant, HeroPhoto>>`; `variantFromFeature({ value, source }: { value: unknown; source: string }): HeroPhotoVariant | null`.
- Produces (in `heroPhotoAssignment.ts`): `assignHeroPhoto(request: Request, locals: unknown, now?: () => Date): Promise<HeroPhotoVariant | null>`.

- [ ] **Step 1: Convert the photos.** Sources (scratchpad, not committed): `/tmp/claude-1000/-home-magnus-Desktop-t4p-website/addd46b2-e985-4c03-93ba-2b792996c213/images/2.png` = speaker, `3.png` = laptops, `4.png` = stage. For each: `magick <src> -resize 1600x -quality 80 public/images/hero/<v>-1600.webp` and `-resize 800x … <v>-800.webp`. Keep each photo's own aspect ratio. Aim for sizes near `happy-kids-1600.webp` (129 KB) / `-800.webp` (54 KB); lower quality if a 1600 file exceeds ~250 KB. Record each 1600 file's height for `HERO_PHOTOS`.
- [ ] **Step 2: Write failing tests** in `heroPhotoExperiment.test.ts`:
  - `variantFromFeature` returns each of the four values for `source: "experiment"`; returns `null` for `source: "force"`, `"defaultValue"`, `"unknownFeature"`, and for `{ value: "other", source: "experiment" }`.
  - every `HERO_PHOTOS` entry has non-empty `alt` and `credit`, a `srcset` with `800w` and `1600w`, and every file it references exists under `public/` (`fs.existsSync`).
  - `HERO_PHOTOS.control` keeps today's values: `src "/happy-kids-1600.webp"`, `width 1600`, `height 1200`, alt `"Children in Gaza smiling for the camera"`, credit `"© Motaz Azaiza"`.
- [ ] **Step 3: Write failing tests** in `heroPhotoAssignment.test.ts`, mocking `./growthbookServer` and `./navAssignment` the way `navAssignment.test.ts` mocks: returns `null` when there is no client key, no payload, or no id; returns the variant when `evalServerFeature` gives `{ value: "laptops", source: "experiment" }`; returns `null` for `{ value: "laptops", source: "force" }`. Plus one unmocked test that builds a real payload `{ features: { "homepage-hero-photo": { defaultValue: "control", rules: [{ key: "homepage-hero-photo", variations: ["control","speaker","laptops","stage"], weights: [0.25,0.25,0.25,0.25], hashAttribute: "id" }] } } }`, evaluates 4,000 random ids with `evalServerFeature`, and asserts every result has `source: "experiment"` and each variant gets between 22% and 28%.
- [ ] **Step 4: Run:** `pnpm vitest run src/utils/heroPhotoExperiment.test.ts src/lib/heroPhotoAssignment.test.ts` → FAIL.
- [ ] **Step 5: Implement `HERO_PHOTOS`** with the spec's alt text verbatim:
  - `speaker`: "A man reads from a sheet of paper to a seated group, with an embroidered map of Palestine hanging on the wall behind him"
  - `laptops`: "Three people work together at laptops covered in Palestinian flag and watermelon stickers"
  - `stage`: "Two people on stage applaud between a Thaura banner and a Tech for Palestine banner"
  - `credit: "TODO credit"` for the three new photos, with a `// TODO(launch): photographer credit from the team` comment.
  - `position`: Tailwind classes, phone first then `lg:` — start from `object-center` (speaker), `object-[50%_50%] lg:object-[52%_50%]` (laptops, centred on the woman), `object-[50%_50%]` (stage). Final values are judged in the preview deploy (Task 6).
- [ ] **Step 6: Implement `variantFromFeature` and `assignHeroPhoto`** — same shape as `assignNavLabelVariant` (client key via `getEnv("PUBLIC_GROWTHBOOK_CLIENT_KEY", locals)` → payload → id → evaluate → `variantFromFeature`).
- [ ] **Step 7: Run** the Step 4 command → PASS.
- [ ] **Step 8: Commit:** `feat(home): hero photo variants and server-side assignment for the photo A/B test`

### Task 5: Homepage link click tracking

**Files:**

- Modify: `src/utils/heroPhotoExperiment.ts`
- Test: `src/utils/heroPhotoExperiment.test.ts`

**Interfaces:**

- Produces: `LINK_CLICK_EVENT = "Homepage Link Click"`; `type HomepageDestination = "/membership" | "/volunteer" | "/projects" | "/incubator"`; `destinationFor(href: string, origin: string): HomepageDestination | null`; `trackHomepageLinks(options?: { track?: (name: string, props: Record<string, string>) => void; doc?: Pick<Document, "addEventListener">; origin?: string }): void`.

- [ ] **Step 1: Write failing tests** (origin `"https://techforpalestine.org"`):
  - `destinationFor` → `/membership` for `/membership`, `/membership/`, `/membership?ref=x`, `/membership#join`, `https://techforpalestine.org/membership`; `/incubator` for `/incubator/`.
  - → `null` for `/incubator-guide`, `/membership/supporting`, `/get-involved`, `https://other.org/projects`, `mailto:a@b.c`, `javascript:void(0)`, `""`, and does not throw on any of them.
  - `trackHomepageLinks` with a fake doc: a `click` whose `target.closest("a[href]")` returns a link to `/projects` → `track("Homepage Link Click", { destination: "/projects" })` once; a target that is a `<span>` inside that link → same single call; `auxclick` with `button: 1` → tracked; `auxclick` with `button: 2` → not tracked; a link to `/get-involved` → not tracked; a target with no `closest` (e.g. text node fake) → not tracked, no throw.
- [ ] **Step 2: Run:** `pnpm vitest run src/utils/heroPhotoExperiment.test.ts` → FAIL.
- [ ] **Step 3: Implement.** `destinationFor`: `new URL(href, origin)` in try/catch; require `url.origin === origin`; strip one trailing slash from `pathname`; exact match against the four paths. `trackHomepageLinks`: one `click` and one `auxclick` listener on `doc` (delegation, so the on-demand mobile menu counts); ignore `auxclick` unless `button === 1`; default `track` is `window.plausible?.(name, { props })` (interactive — a click is a real interaction); default `origin` is `location.origin`. `hero_photo` is not added here: `customProperties` attaches it.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit:** `feat(home): track homepage clicks to membership, volunteer, projects and incubator`

### Task 6: Wire the experiment into the homepage

**Files:**

- Modify: `src/pages/index.astro` (frontmatter, hero `<figure>`, `<Layout>` props, page `<script>`)
- Modify: `docs/ARCHITECTURE.md` or `docs/README.md` — one short entry pointing at the spec (wherever the nav test is documented)

**Interfaces:**

- Consumes: `assignHeroPhoto` (Task 4), `HERO_PHOTOS`, `HERO_PHOTO_EXPERIMENT` (Task 4), `trackHomepageLinks` (Task 5), Layout `analyticsProps` (Task 2).

- [ ] **Step 1: Frontmatter.** `const heroVariant = await assignHeroPhoto(Astro.request, Astro.locals);` `const hero = HERO_PHOTOS[heroVariant ?? "control"];` Comment: why the id is daily and that `/` must stay uncached by shared caches (it is `private, max-age=600` via `cache-control.ts`).
- [ ] **Step 2: Hero `<figure>`.** `<img>` takes `src`, `srcset`, `width`, `height`, `alt` from `hero` and appends `hero.position` to the existing classes (`class:list`); keep `sizes`, `fetchpriority="high"`, `decoding="async"`. `<figcaption>` renders `hero.credit`. Add `data-hero-photo={heroVariant ?? undefined}` to the `<figure>`.
- [ ] **Step 3: Layout.** Pass `analyticsProps={heroVariant ? { hero_photo: heroVariant } : undefined}`.
- [ ] **Step 4: Page script.** In the existing `<script>`, `if (document.querySelector("[data-hero-photo]")) trackHomepageLinks();`
- [ ] **Step 5: Docs.** Add the entry from Files.
- [ ] **Step 6: Verify:** `pnpm lint && pnpm check && pnpm test && pnpm build` → all pass.
- [ ] **Step 7: Commit:** `feat(home): A/B test four hero photos with GrowthBook, measured in Plausible`

---

## After the code (not for implementer subagents)

Launch checklist for the human, from the spec's "Running the test":

1. Merge Task 1's PR, then the feature PR. Create the GrowthBook flag `homepage-hero-photo` (string, default `control`, Experiment rule, 4 × 25%, hash on `id`) — **off**.
2. In a Cloudflare preview/production deploy with the flag on for testing: each photo renders with a good crop on desktop and a ~390px-wide phone; the pageview request to `/api/pipe` carries `hero_photo`; Plausible's engagement events carry it too (if not, apply the spec's bucketed `Homepage Engagement` fallback before launch); a prerendered `/` sends its pageview only when shown; clicks send `Homepage Link Click`.
3. Plausible: add goal `Homepage Link Click`; add property `hero_photo`.
4. Replace the three `TODO credit` values once the team sends credits.
5. Turn the flag on; run 14 full days; analyse per the spec.
