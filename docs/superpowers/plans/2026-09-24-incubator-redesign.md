# /incubator Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/incubator` on the live design system (DESIGN.md, "The Organizing Table") so a prospective project lead can see fit, benefits, obligations and timeline at a glance, and apply.

**Architecture:** Page copy moves into a typed data module, `src/data/incubator.ts`, following the `src/data/membershipBenefits.ts` pattern. `src/pages/incubator.astro` is fully replaced by a plain-Astro page (no islands) of alternating Paper sections and First Light bands, ending in the page's one Nightfall CTA. It reuses founder testimonials from `src/data/testimonials.ts` and follows the markup conventions of `src/pages/supporting-member.astro`.

**Tech Stack:** Astro 5 (SSR, Cloudflare adapter), Tailwind CSS (arbitrary values + `ink` tokens from `tailwind.config.mjs`), Plausible custom events.

**Spec:** `docs/superpowers/specs/2026-09-24-incubator-redesign-design.md`

## Global Constraints

- Package manager is `pnpm`. Never `yarn` or `npx astro`.
- No test framework exists. The "failing test" for each task is the **design guard** below plus `pnpm check`; do not add Vitest for this work.
- Do not start the dev server, curl pages, or run Prettier on your own. The plan's explicit `pnpm check` / `pnpm build` steps are the only build commands to run. The user verifies visually.
- Do not touch `src/pages/incubator-new.astro` or `src/pages/_incubator.old` (dead code per CLAUDE.md).
- Colors only: `text-ink`, `text-ink-secondary`, `border-ink-divider`, `#157A3E` (hover `#0e5a2f`), `#2F5C3F` (overlines only), `#E7F2E9` band, `#D2E4D6` band edge, `#101010` (exactly one block).
- Container: `mx-auto max-w-[1280px] px-6 sm:px-8`.
- Elevation: `shadow-sm` or none.
- No em dashes (`—`) anywhere in page or data, including comments.
- No inline `style=""` (CSP silently blocks it in production). No new external scripts.
- Keep every existing fact verbatim in meaning: 200+ projects, 3000+ volunteers, 60+ project leaders, Office Hours with Paul Biggar 6x/week, 10-30 minute form, 30-minute interview, twice-weekly decisions, decision within 10 days, first 6 weeks weekly Office Hours then monthly until product-market fit, 10 million users example.
- Apply destination stays `/project-application-form`, same tab.
- Commits: conventional format, scope `incubator`, e.g. `feat(incubator): ...`. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Page file stays under 400 lines.

**Design guard** (run from repo root; referenced by every task):

```bash
grep -nE 'gradient|(text|bg|border|from|to|ring)-(blue|indigo|purple|violet|amber|orange|red|pink|yellow|emerald|slate|gray|green)-[0-9]|shadow-(md|lg|xl)|scale-10|border-t-\[3px\]|border-l-[0-9[]|target="_blank"|ts-[a-z]|font-serif|style="|—' src/pages/incubator.astro src/data/incubator.ts
```

Expected when passing: **no output** (grep exits 1). Any printed line is a failure.

## Review Focus

1. **Phone width (360px).** Every two-column grid must collapse to one column below `lg`/`md`; chip row wraps; no horizontal scroll. Pinned by the `grid-cols-1` base classes in Tasks 2-4 and the 360px check in Task 5.
2. **Plausible blocked or absent.** Apply links must still navigate when `window.plausible` is undefined (ad blockers). Pinned by the guarded handler and Step 4 check in Task 4.
3. **Keyboard users.** Every link and button shows a Grove Green (or white, on Nightfall) focus ring. Pinned by the focus-ring grep in Task 4 Step 5.
4. **Testimonial data drift.** A founder added later with `headshots` (pair) or no image must not render a broken `<img>`. Pinned by the `headshot ?? headshots?.[0]` fallback and conditional render in Task 3.
5. **Reduced motion.** Only color transitions exist, and each carries `motion-reduce:transition-none`. Pinned by the grep in Task 5 Step 2.

---

### Task 1: Incubator content module

**Files:**
- Create: `src/data/incubator.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `APPLY_URL: string` (`"/project-application-form"`)
  - `interface IncubatorItem { title: string; description: string }`
  - `focusAreas: string[]`
  - `supportIntro: { newBuilders: string; experiencedTeams: string }`
  - `offerings: IncubatorItem[]` (8)
  - `expectations: IncubatorItem[]` (4)
  - `notRequired: IncubatorItem[]` (3)
  - `applicationSteps: IncubatorItem[]` (5)

- [ ] **Step 1: Run the guard to see it fail**

Run the design guard.
Expected: many lines from `src/pages/incubator.astro` (`bg-gradient-to-r`, `text-blue-600`, `target="_blank"`, ...) and `grep: src/data/incubator.ts: No such file or directory`.

- [ ] **Step 2: Create `src/data/incubator.ts`**

```ts
/** Copy for /incubator. Facts here mirror the pre-redesign page; change
 * numbers only with sign-off from the incubator team. */

export const APPLY_URL = "/project-application-form";

export interface IncubatorItem {
  title: string;
  description: string;
}

/** Areas incubated projects often, but not always, work in. */
export const focusAreas: string[] = [
  "Scaling up boycotts",
  "Protest tech",
  "Tech industry and VC divestment",
  "Media bias",
  "Reaching new audiences with the Palestinian message",
  "Silicon Valley and Palestine partnerships",
  "Bias in AI",
  "Exposing Hasbara",
];

export const supportIntro = {
  newBuilders:
    "Many projects for Palestine start with an advocate who has a good idea but doesn't yet know how to execute it. We support you along the way with what we know about building scalable projects, working with volunteers and the pro-Palestine ecosystem, and with our platform and network.",
  experiencedTeams:
    "More experienced teams get our connections and platform, strategic advice on the right niche to start in, and our knowledge of what already exists in the ecosystem and how to partner with it.",
};

export const offerings: IncubatorItem[] = [
  {
    title: "Strategic advice",
    description:
      "Every project starts with a strategy session, honing your approach with expertise from 200+ projects.",
  },
  {
    title: "Mentorship",
    description:
      "Office Hours with Paul Biggar six times a week, plus optional weekly sessions with a dedicated mentor.",
  },
  {
    title: "Marketing",
    description:
      "Early users through press, influencers, ecosystem partners and our supportive community.",
  },
  {
    title: "Volunteers",
    description: "Access to 3000+ volunteers, with support from a dedicated recruitment team.",
  },
  {
    title: "Connections",
    description:
      "Introductions across the Palestine advocacy ecosystem, to the right partners for your initiative.",
  },
  {
    title: "Funding",
    description: "Small grants for most projects, with minimal fuss.",
  },
  {
    title: "Community",
    description: "60+ project leaders facing similar challenges and supporting each other.",
  },
  {
    title: "Education",
    description:
      "Seminars on marketing, sales, go-to-market, technical projects and T4P branding.",
  },
];

export const expectations: IncubatorItem[] = [
  {
    title: "Focus on impact",
    description: "Aim for impact at scale, for example reaching 10 million users.",
  },
  {
    title: "Commitment",
    description: "Project leaders keep working on their project and drive it forward.",
  },
  {
    title: "Communication",
    description:
      "Stay in touch: attend Office Hours, send updates and work with T4P staff where needed. Attend at least one Office Hours call a week for your first 6 weeks, then at least once a month until you reach product-market fit.",
  },
  {
    title: "Flexible participation",
    description:
      "If the incubator no longer fits your needs, or you stop participating, your membership may be removed, with no hard feelings.",
  },
];

export const notRequired: IncubatorItem[] = [
  {
    title: "No daily meetings",
    description: "Daily or multiple weekly meetings are not required.",
  },
  {
    title: "No T4P ownership",
    description: "Official T4P branding or ownership of your work is not required.",
  },
  {
    title: "Your own tools",
    description: "Use whatever infrastructure or tools work best for your project.",
  },
];

export const applicationSteps: IncubatorItem[] = [
  {
    title: "Apply",
    description: "Fill out the application form. It takes 10 to 30 minutes.",
  },
  {
    title: "Review",
    description:
      "We review your application and invite selected projects to interview. Sometimes we reach out for more information first.",
  },
  {
    title: "Interview",
    description:
      "A 30-minute call about the impact you intend to have and how you'll get there. Please don't prepare slides. Interviews are direct and push on your understanding of the problem.",
  },
  {
    title: "Decision",
    description:
      "We decide whether to admit you and tell you as soon as possible. Sometimes we follow up with more questions first.",
  },
  {
    title: "Next steps",
    description:
      "If admitted, you'll get an email with next steps and access to Tech for Palestine's resources.",
  },
];
```

- [ ] **Step 3: Verify the data file is clean and type-checks**

Run: `grep -n '—' src/data/incubator.ts`
Expected: no output.

Run: `pnpm check`
Expected: exits 0; no new errors or warnings mentioning `src/data/incubator.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/data/incubator.ts
git commit -m "feat(incubator): move incubator page copy into a data module

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Replace the page: hero, "Who it's for", "What you get"

**Files:**
- Modify (full replace): `src/pages/incubator.astro`

**Interfaces:**
- Consumes: `APPLY_URL`, `focusAreas`, `supportIntro`, `offerings` from Task 1.
- Produces (used by Tasks 3-4, defined in page frontmatter):
  - `primaryButton: string` (Grove Green pill class list)
  - `overline: string` (band overline class list)
  - `h2: string` (section heading class list)
  - `bandShell: string` (First Light band `<section>` class list)
  - `container: string`
  - The page's `<main>` element; later tasks insert sections **immediately before `  </main>`**.
  - Apply links carry `data-track-incubator-click="<location>"`; Task 4 wires the handler.

- [ ] **Step 1: Confirm the guard currently fails on the page**

Run the design guard.
Expected: dozens of hits in `src/pages/incubator.astro`.

- [ ] **Step 2: Replace `src/pages/incubator.astro` entirely with:**

```astro
---
import Layout from "../layouts/Layout.astro";
import { APPLY_URL, focusAreas, offerings, supportIntro } from "../data/incubator";
import "../styles/base.css";

const container = "mx-auto max-w-[1280px] px-6 sm:px-8";
const h2 =
  "text-[28px] font-extrabold leading-tight tracking-tight text-ink min-[810px]:text-[38px]";
const lede = "text-[19px] leading-relaxed text-ink min-[810px]:text-[21px]";
const overline = "mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#2F5C3F]";
const bandShell = "border-y border-[#D2E4D6] bg-[#E7F2E9]";
const primaryButton =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#157A3E] px-7 py-3.5 font-bold text-white shadow-sm transition-colors duration-150 hover:bg-[#0e5a2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157A3E] focus-visible:ring-offset-2 motion-reduce:transition-none";
---

<Layout
  title="Incubator - Tech for Palestine"
  description="The Tech for Palestine incubator helps projects for Palestinian liberation launch and scale, with strategy, mentorship, volunteers, marketing, connections and small grants. Apply in 10 to 30 minutes."
>
  <main>
    <!-- Hero: the offer and the ask, beside a real photo from a T4P gathering -->
    <section class={`${container} py-16 min-[810px]:py-20`}>
      <div
        class="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14"
      >
        <div class="max-w-[700px]">
          <h1
            class="mb-6 text-[38px] font-extrabold leading-[1.05] tracking-tight text-ink min-[810px]:text-[54px] min-[810px]:leading-[1.02]"
          >
            Build a project for Palestine. We'll help it scale.
          </h1>
          <p class={lede}>
            The Tech for Palestine incubator gets initiatives for Palestine off the ground and
            helps them grow, so they can educate the world about Palestine and counter Hasbara and
            Zionism wherever it takes hold.
          </p>
          <p class={`mt-3.5 ${lede}`}>
            We take on a limited number of projects and back them with our expertise and
            resources.
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={APPLY_URL} data-track-incubator-click="hero" class={primaryButton}>
              Apply to the incubator
            </a>
            <p class="text-[16px] text-ink-secondary">
              Takes 10 to 30 minutes. Decision within 10 days.
            </p>
          </div>
        </div>
        <img
          src="/images/membership/member-panel.webp"
          alt="Panelists in conversation on stage at a Tech for Palestine gathering"
          width="1600"
          height="1068"
          class="block h-auto w-full rounded-lg shadow-sm"
          fetchpriority="high"
          decoding="async"
        />
      </div>
    </section>

    <!-- Band: who it's for -->
    <section class={bandShell}>
      <div class={`${container} py-14 min-[810px]:py-16`}>
        <p class={overline}>Who it's for</p>
        <h2 class={`max-w-[24ch] ${h2}`}>
          Early-stage projects for Palestine that can scale.
        </h2>
        <p class={`mt-4 max-w-[65ch] ${lede}`}>
          Any project that directly or indirectly advocates for Palestine, where we believe it can
          have impact and grow. Our projects are often, but not always, in these areas:
        </p>
        <ul class="mt-8 flex flex-wrap gap-2.5" aria-label="Common project areas">
          {
            focusAreas.map((area) => (
              <li class="rounded-full border border-[#D2E4D6] bg-white px-4 py-2 text-[16px] font-bold text-ink">
                {area}
              </li>
            ))
          }
        </ul>
      </div>
    </section>

    <!-- What you get: narrative on the left, ruled list of offerings on the right -->
    <section class={`${container} py-16 min-[810px]:py-20`}>
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div class="lg:sticky lg:top-24 lg:self-start">
          <h2 class={h2}>What the incubator gives you</h2>
          <p class="mt-5 max-w-[65ch] text-[17px] leading-relaxed text-ink-secondary">
            {supportIntro.newBuilders}
          </p>
          <p class="mt-4 max-w-[65ch] text-[17px] leading-relaxed text-ink-secondary">
            {supportIntro.experiencedTeams}
          </p>
        </div>
        <dl class="border-b border-ink-divider">
          {
            offerings.map((item) => (
              <div class="grid grid-cols-1 gap-1 border-t border-ink-divider py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
                <dt class="text-[17px] font-bold leading-snug text-ink">{item.title}</dt>
                <dd class="max-w-[60ch] text-[17px] leading-relaxed text-ink-secondary">
                  {item.description}
                </dd>
              </div>
            ))
          }
        </dl>
      </div>
    </section>
  </main>
</Layout>
```

- [ ] **Step 3: Run the guard and type check**

Run the design guard.
Expected: no output.

Run: `pnpm check`
Expected: exits 0, no new diagnostics in `src/pages/incubator.astro`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/incubator.astro
git commit -m "feat(incubator): rebuild hero, audience and offerings on the live design system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: "The deal", "How applying works", founder voices

**Files:**
- Modify: `src/pages/incubator.astro` (frontmatter imports; insert sections immediately before `  </main>`)

**Interfaces:**
- Consumes: `expectations`, `notRequired`, `applicationSteps`, `APPLY_URL` (Task 1); `container`, `h2`, `overline`, `bandShell`, `lede` (Task 2); `getTestimonials(): Testimonial[]` from `src/data/testimonials.ts` where `Testimonial = { quote; name; role; kind: "member" | "founder"; headshot?: string; headshots?: [string, string] }`.
- Produces: second apply link with `data-track-incubator-click="process"`.

- [ ] **Step 1: Update the frontmatter imports and add the founder filter**

In the frontmatter, replace:

```ts
import { APPLY_URL, focusAreas, offerings, supportIntro } from "../data/incubator";
```

with:

```ts
import {
  APPLY_URL,
  applicationSteps,
  expectations,
  focusAreas,
  notRequired,
  offerings,
  supportIntro,
} from "../data/incubator";
import { getTestimonials } from "../data/testimonials";
```

Then, directly after the `primaryButton` constant, add:

```ts

// Founders only: this page recruits project leads. Hani & Said are held back
// on /supporting-member pending approval, so they stay off this page too.
const HIDDEN_FOR_NOW = ["Hani & Said Chihabi"];
const founderVoices = getTestimonials()
  .filter((t) => t.kind === "founder" && !HIDDEN_FOR_NOW.includes(t.name))
  .map((t) => ({ ...t, image: t.headshot ?? t.headshots?.[0] }));
```

- [ ] **Step 2: Insert the three sections immediately before `  </main>`**

```astro
    <!-- Band: the deal, both sides of it -->
    <section class={bandShell}>
      <div class={`${container} py-14 min-[810px]:py-16`}>
        <p class={overline}>The deal</p>
        <h2 class={`max-w-[28ch] ${h2}`}>What we ask of you, and what we don't.</h2>
        <div class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          <div class="rounded-lg border border-[#D2E4D6] bg-white p-7">
            <h3 class="text-xl font-extrabold tracking-tight text-ink">We ask</h3>
            <ul class="mt-4">
              {
                expectations.map((item) => (
                  <li class="border-t border-ink-divider py-4 first:border-t-0 first:pt-2">
                    <p class="text-[17px] font-bold text-ink">{item.title}</p>
                    <p class="mt-1 text-[16px] leading-relaxed text-ink-secondary">
                      {item.description}
                    </p>
                  </li>
                ))
              }
            </ul>
          </div>
          <div class="rounded-lg border border-[#D2E4D6] bg-white p-7">
            <h3 class="text-xl font-extrabold tracking-tight text-ink">We don't ask</h3>
            <ul class="mt-4">
              {
                notRequired.map((item) => (
                  <li class="border-t border-ink-divider py-4 first:border-t-0 first:pt-2">
                    <p class="text-[17px] font-bold text-ink">{item.title}</p>
                    <p class="mt-1 text-[16px] leading-relaxed text-ink-secondary">
                      {item.description}
                    </p>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- How applying works: the timeline promise on the left, numbered steps on the right -->
    <section class={`${container} py-16 min-[810px]:py-20`}>
      <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div class="lg:sticky lg:top-24 lg:self-start">
          <h2 class={h2}>How applying works</h2>
          <p class={`mt-5 max-w-[40ch] ${lede}`}>
            Interviews and decisions happen twice a week. We aim to give every applicant a
            decision within <strong class="font-bold text-[#157A3E]">10 days</strong>.
          </p>
          <a
            href={APPLY_URL}
            data-track-incubator-click="process"
            class="mt-6 inline-flex items-center gap-1.5 rounded-sm text-[17px] font-bold text-[#157A3E] underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[#0e5a2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157A3E] focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Start your application <span aria-hidden="true">→</span>
          </a>
        </div>
        <ol class="border-b border-ink-divider">
          {
            applicationSteps.map((step, i) => (
              <li class="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-t border-ink-divider py-6 sm:grid-cols-[4rem_minmax(0,1fr)]">
                <span
                  class="text-[32px] font-extrabold leading-none tabular-nums text-[#157A3E] min-[810px]:text-[38px]"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 class="text-[17px] font-bold text-ink">{step.title}</h3>
                  <p class="mt-1 max-w-[60ch] text-[17px] leading-relaxed text-ink-secondary">
                    {step.description}
                  </p>
                </div>
              </li>
            ))
          }
        </ol>
      </div>
    </section>

    <!-- Band: founder voices -->
    {
      founderVoices.length > 0 && (
        <section class={bandShell}>
          <div class={`${container} py-14 min-[810px]:py-16`}>
            <p class={overline}>From project leaders</p>
            <h2 class={`max-w-[28ch] ${h2}`}>What incubated founders say.</h2>
            <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
              {founderVoices.map((t) => (
                <figure class="flex flex-col rounded-lg border border-[#D2E4D6] bg-white p-7">
                  <blockquote class="text-[19px] leading-relaxed tracking-tight text-ink">
                    “{t.quote}”
                  </blockquote>
                  <figcaption class="mt-auto flex items-center gap-3 pt-6">
                    {t.image && (
                      <img
                        src={t.image}
                        alt=""
                        width="40"
                        height="40"
                        loading="lazy"
                        decoding="async"
                        class="block h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <span class="block leading-snug">
                      <strong class="block text-[15px] font-bold text-ink">{t.name}</strong>
                      <span class="text-[15px] text-ink-secondary">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )
    }
```

- [ ] **Step 3: Check band alternation and guard**

Run: `grep -c 'class={bandShell}' src/pages/incubator.astro`
Expected: `3`.

Run the design guard.
Expected: no output.

Run: `pnpm check`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/incubator.astro
git commit -m "feat(incubator): add expectations, application steps and founder voices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Other ways in, terminal CTA, apply-click tracking

**Files:**
- Modify: `src/pages/incubator.astro` (insert before `  </main>`; add `<script>` after `</main>`)

**Interfaces:**
- Consumes: `container`, `h2`, `APPLY_URL` (Tasks 1-2); `data-track-incubator-click` attributes from Tasks 2-3.
- Produces: Plausible event `Incubator Apply Click` with prop `cta_location: "hero" | "process" | "terminal"`.

- [ ] **Step 1: Insert the two closing sections immediately before `  </main>`**

```astro
    <!-- Other ways in, for people who want to help but not lead a project yet -->
    <section class={`${container} py-16 min-[810px]:py-20`}>
      <h2 class={h2}>Not ready to apply?</h2>
      <ul class="mt-8 max-w-[860px] border-b border-ink-divider">
        <li class="flex flex-col gap-3 border-t border-ink-divider py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p class="text-[19px] font-bold text-ink">You want to lead, but don't have an idea yet</p>
            <p class="mt-1 text-[17px] text-ink-secondary">
              Pick one from our list of project ideas.
            </p>
          </div>
          <a
            href="/ideas"
            class="shrink-0 rounded-sm text-[17px] font-bold text-[#157A3E] underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[#0e5a2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157A3E] focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Browse project ideas <span aria-hidden="true">→</span>
          </a>
        </li>
        <li class="flex flex-col gap-3 border-t border-ink-divider py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div>
            <p class="text-[19px] font-bold text-ink">You'd rather contribute than lead</p>
            <p class="mt-1 text-[17px] text-ink-secondary">
              Bring your skills to projects already underway.
            </p>
          </div>
          <a
            href="/volunteer"
            class="shrink-0 rounded-sm text-[17px] font-bold text-[#157A3E] underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[#0e5a2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157A3E] focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Register as a volunteer <span aria-hidden="true">→</span>
          </a>
        </li>
      </ul>
      <p class="mt-6 text-[16px] text-ink-secondary">
        Already applied? We'll reach out to you soon.
      </p>
    </section>

    <!-- Terminal CTA: the one dark block on the page, carrying the primary ask -->
    <section class="bg-[#101010] px-6 py-20 sm:px-8">
      <div class="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h2 class="text-2xl font-extrabold leading-tight tracking-tight text-white md:text-[32px]">
          Have a project for Palestine? Let's get it off the ground.
        </h2>
        <a
          href={APPLY_URL}
          data-track-incubator-click="terminal"
          class="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-8 py-3.5 font-bold text-ink shadow-sm transition-colors duration-150 hover:bg-[#F2F3EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010] motion-reduce:transition-none"
        >
          Apply to the incubator
        </a>
      </div>
    </section>
```

- [ ] **Step 2: Add the tracking script between `  </main>` and `</Layout>`**

```astro
  <script>
    document
      .querySelectorAll<HTMLAnchorElement>("[data-track-incubator-click]")
      .forEach((link) => {
        link.addEventListener("click", () => {
          if (typeof window.plausible === "undefined") return;
          window.plausible("Incubator Apply Click", {
            props: {
              cta_location: link.dataset.trackIncubatorClick ?? "unknown",
              destination: link.getAttribute("href") ?? "",
            },
          });
        });
      });
  </script>
```

(`window.plausible` is already typed globally; `src/pages/supporting-member.astro` uses the identical call shape.)

- [ ] **Step 3: Structural checks**

Run: `grep -c 'bg-\[#101010\]' src/pages/incubator.astro`
Expected: `1` (Single Dark Block Rule).

Run: `grep -c 'data-track-incubator-click="' src/pages/incubator.astro`
Expected: `3`.

Run: `grep -c 'href={APPLY_URL}' src/pages/incubator.astro`
Expected: `3`.

- [ ] **Step 4: Confirm the handler never blocks navigation**

Read the script from Step 2 and confirm: no `preventDefault`, no `await`, and the `typeof window.plausible === "undefined"` early return is the first statement in the listener. (Covers Review Focus 2.)

- [ ] **Step 5: Focus-ring coverage**

Run: `grep -c '<a$\|<a ' src/pages/incubator.astro` and `grep -o 'focus-visible:ring-2' src/pages/incubator.astro | wc -l`
Expected: both print `5`. The five links are hero (styled via the `primaryButton` constant, whose single `focus-visible:ring-2` is counted once in the frontmatter), process, ideas, volunteer and terminal. Also confirm the hero `<a>` uses `class={primaryButton}`. (Covers Review Focus 3.)

- [ ] **Step 6: Guard and type check**

Run the design guard.
Expected: no output.

Run: `pnpm check`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/pages/incubator.astro
git commit -m "feat(incubator): add alternate paths, terminal CTA and apply-click tracking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Final verification and handoff

**Files:**
- None created. Read-only checks, then a production build.

**Interfaces:**
- Consumes: the finished page.
- Produces: a verified branch ready for "ship it".

- [ ] **Step 1: Size and dead-weight check**

Run: `wc -l src/pages/incubator.astro`
Expected: under 400 (was 1,022).

Run: `grep -c '<svg' src/pages/incubator.astro`
Expected: `0` (all decorative icon circles are gone).

- [ ] **Step 2: Reduced-motion coverage**

Run: `grep -o 'transition-colors' src/pages/incubator.astro | wc -l` and `grep -o 'motion-reduce:transition-none' src/pages/incubator.astro | wc -l`
Expected: both counts equal (the `primaryButton` constant counts once for each). Any `transition-[`, `animate-`, `hover:scale` or `hover:-translate` in the file is a failure.

- [ ] **Step 3: Full guard, type check, production build**

Run the design guard. Expected: no output.
Run: `pnpm check`. Expected: exits 0.
Run: `pnpm build`. Expected: build succeeds; `/incubator` is listed among server routes with no warnings mentioning `incubator`.

- [ ] **Step 4: Hand to the user for visual verification**

Do not start the dev server. Ask the user to check, at 360px, 810px and 1440px:
- No horizontal scroll at 360px; the chip row wraps; the offerings list shows term above description on phones and side by side from `sm`.
- Bands alternate Paper / First Light / Paper / First Light / Paper / First Light / Paper, then the single dark CTA.
- Tab through the page: every link shows a visible ring; on the dark CTA the ring is white.
- Founder quotes show Issam Hijazi and Nima Akram with headshots.
- Clicking any "Apply" link lands on `/project-application-form` in the same tab.

- [ ] **Step 5: Ship only on request**

When the user says "ship it": branch `feat/incubator-redesign` from `main` (if not already on it), push with `-u`, open a PR titled `feat(incubator): redesign /incubator on the live design system`, summarizing the spec's problem list and linking the spec and plan, ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

---

## Amendment (2026-09-24, user request mid-execution)

Run this task after Task 4 and before Task 5. It supersedes the founder-voices markup from Task 3 and its copy ("founders").

### Task 6: Project Leader wording and shared testimonial card (user amendment)

**Why:** The user asked for "Project Leader" instead of "Founder" in visible copy, and for the membership testimonial card to be used instead of the bespoke founder card. No shared testimonial component exists (membership's card is inline in `src/components/membership/MembershipMain.astro`), so extract one. Membership and supporting-member pages are NOT touched.

**Files:**
- Create: `src/components/membership/TestimonialCard.astro`
- Modify: `src/pages/incubator.astro` (frontmatter + the founder-voices band only)
- Modify: `docs/superpowers/specs/2026-09-24-incubator-redesign-design.md` (wording only, see Step 4)

**Interfaces:**
- Produces: `TestimonialCard.astro` with `interface Props { quote: string; name: string; role: string; image?: string }`.
- Consumes: `getTestimonials()` from `src/data/testimonials.ts` (unchanged; keep the `kind === "founder"` data filter, that is a data field, not visible copy).

- [ ] **Step 1: Create `src/components/membership/TestimonialCard.astro`**

This is the card from `MembershipMain.astro` (non-designSystem branch: `rounded-lg`, `border border-[#D2E4D6]`, `bg-white`, `p-7`, quote `text-[19px] leading-relaxed tracking-tight text-ink`, name `text-[13px] font-bold text-ink`, role `text-[13px] text-ink-secondary`, 34px round avatar) WITHOUT the `border-t-[3px] border-t-[#157A3E]` stripe, which DESIGN.md prohibits (No Stripe Rule).

```astro
---
interface Props {
  quote: string;
  name: string;
  role: string;
  image?: string;
}

const { quote, name, role, image } = Astro.props;
---

<figure class="flex flex-col rounded-lg border border-[#D2E4D6] bg-white p-7">
  <blockquote class="text-[19px] leading-relaxed tracking-tight text-ink">“{quote}”</blockquote>
  <figcaption class="mt-auto flex items-center gap-3 pt-6">
    {
      image && (
        <img
          src={image}
          alt=""
          width="34"
          height="34"
          loading="lazy"
          decoding="async"
          class="block h-[34px] w-[34px] shrink-0 rounded-full object-cover"
        />
      )
    }
    <span class="block leading-snug">
      <strong class="block text-[13px] font-bold text-ink">{name}</strong>
      <span class="text-[13px] text-ink-secondary">{role}</span>
    </span>
  </figcaption>
</figure>
```

- [ ] **Step 2: Update `src/pages/incubator.astro` frontmatter**

Add the import next to the other imports:

```ts
import TestimonialCard from "../components/membership/TestimonialCard.astro";
```

Replace the existing founder-voices block (the `HIDDEN_FOR_NOW` comment, the constant and the `founderVoices` definition) with:

```ts
// Project leaders only: this page recruits them. Hani & Said are held back
// on /supporting-member pending approval, so they stay off this page too.
// "Founder" is shown as "Project Leader" on this page.
const HIDDEN_FOR_NOW = ["Hani & Said Chihabi"];
const projectLeaderVoices = getTestimonials()
  .filter((t) => t.kind === "founder" && !HIDDEN_FOR_NOW.includes(t.name))
  .map((t) => ({
    ...t,
    role: t.role.replace("Founder", "Project Leader"),
    image: t.headshot ?? t.headshots?.[0],
  }));
```

- [ ] **Step 3: Replace the founder-voices band markup**

Replace the whole `{founderVoices.length > 0 && (...)}` block with:

```astro
    {
      projectLeaderVoices.length > 0 && (
        <section class={bandShell}>
          <div class={`${container} py-14 min-[810px]:py-16`}>
            <p class={overline}>From project leaders</p>
            <h2 class={`max-w-[28ch] ${h2}`}>What incubated project leaders say.</h2>
            <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
              {projectLeaderVoices.map((t) => (
                <TestimonialCard quote={t.quote} name={t.name} role={t.role} image={t.image} />
              ))}
            </div>
          </div>
        </section>
      )
    }
```

- [ ] **Step 4: Wording in the spec**

In `docs/superpowers/specs/2026-09-24-incubator-redesign-design.md`: rename the table row 6 section to "Project leader voices" (content: "Project leader testimonials via the shared `TestimonialCard`; `kind: \"founder\"` entries, shown as Project Leader, approved subset only"), and in Open question 1 say "project leaders" where it says "founders". Do not edit anything else. (The docs are untracked; do not commit them.)

- [ ] **Step 5: Verify**

Run: `grep -n -i 'founder' src/pages/incubator.astro`
Expected: only the `t.kind === "founder"` data filter and the `t.role.replace("Founder", ...)` call; no visible copy, no `founderVoices`.

Run the design guard (from the plan header). Expected: no output. Additionally: `grep -n 'border-t-\[3px\]' src/components/membership/TestimonialCard.astro` must print nothing.

Run: `pnpm check`. Expected: exit 0.

Confirm `src/components/membership/MembershipMain.astro` and `src/pages/supporting-member.astro` are unchanged: `git status --short` must not list them.

- [ ] **Step 6: Commit**

```bash
git add src/components/membership/TestimonialCard.astro src/pages/incubator.astro
git commit -m "feat(incubator): use a shared testimonial card and say Project Leader"
```
(No Co-Authored-By trailer: user rule.)
