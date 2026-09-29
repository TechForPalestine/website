# Membership Copy Tweaks, Supporting-Member Dues Card and "Log into Hub" Nav Button: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the client's latest round of membership-page requests: Step 2 tier-card copy and styling, hiding the calculator for Supporting Members, dues-card copy, supporting-member page form and card changes, and a "Log into Hub" nav button.

**Architecture:** Most of the work is in `src/components/membership/JoinFlow.tsx`. The tier-card data and the calculator/helper-line decisions move into a small pure module, `joinFlowContent.ts`, so the existing Vitest setup (node environment, `*.test.ts` only) can cover them without adding a DOM test stack. The "How does T4P use dues?" body copy is pulled into one shared Astro component so `/membership` and `/supporting-member` can't drift apart. The nav button is a plain addition to `NavBar.svelte`.

**Tech Stack:** Astro 5 (SSR), React 19 island (`JoinFlow`, `client:only="react"`), Svelte 5 (`NavBar`), Tailwind, Vitest 3.

**Spec:** The client request quoted in the session of 2026-09-28 (reproduced in "Requirements" below).

## Requirements (client request, verbatim intent)

| # | Where | Change |
|---|---|---|
| R1 | `/membership` Step 2, Member card | Description "If you would like to volunteer on projects & teams." becomes **"Build the movement"** |
| R2 | `/membership` Step 2, Supporting card | Description "If you do not have time to volunteer but would like to support financially." becomes **"Fund the movement"** |
| R3 | Same | Make both descriptions green |
| R4 | Member card bullets | "Volunteer or mentor on projects" and "Join the private member chat" use **➜** as their bullet instead of the dot |
| R5 | Member card bullets | Move "Volunteer or mentor on projects" to sit directly before "Join the private member chat" |
| R6 | `/membership` Step 3 | If Supporting Member was chosen, hide the calculator; show it only for Member |
| R7 | Member card note | "we do a quick identity and alignment check during onboarding." becomes "we do an identity and alignment check during onboarding." |
| R8 | `/membership` "How does T4P use dues?" | Paragraph break after "Mentorship"; the next line becomes "Via T4P staff support, software access, partnerships and grants." |
| R9 | `/supporting-member` Step 1 of 2 | Remove "Dues are pay-what-you-can" and "Waivers available" from the helper line (keep "Tax deductible in the US") |
| R10 | `/supporting-member`, under the form | Add a card matching `/membership`'s "How does T4P use dues?" card, same copy as R8 |
| R11 | Site nav | Add a "Log into Hub" button linking to `https://hub.techforpalestine.org/` |

## Global Constraints

- Only live pages. Do not touch any `*-new.astro` file, `HomeLayout.astro` or `design-system.css` (CLAUDE.md: "the abandoned -new redesign").
- No inline `style=""` attributes and no new inline `<script>` (CSP in `src/middleware/csp.ts`).
- Brand green is `#157A3E` (hover `#0e5a2f`), matching `JoinFlow.tsx` and `DESIGN.md`.
- Copy: use the client's wording exactly, sentence case ("Build the movement", not "Build the Movement"). No em dashes in new copy.
- Use `pnpm` only. Per the user's standing preferences, don't run `pnpm build`, `pnpm check`, `pnpm format` or the dev server unless asked. `pnpm test` (Vitest) is part of this plan's TDD loop and is fine to run.
- Commit style: conventional commits, e.g. `feat(membership): …`, `feat(nav): …`. No Claude co-author lines.

## Review Focus

1. **Back-and-forth tier switching (R6).** Visitor picks Supporting, reaches Step 3, goes back (there is no Back on Step 3 today, but they can reload or re-enter), then picks Member. The calculator must follow the *current* `tier`, not the first one picked. Pinned by the `showCalculator` test using both tiers, and it's derived from `tier` at render time rather than stored.
2. **`/supporting-member` also sets `hideCalculator`.** The new tier rule must not bring the calculator back there. Pinned by the test case `showCalculator("supporting", true) === false` and `showCalculator("member", true) === false`.
3. **The Step 1 helper line on `/membership` must not change (R9 is supporting-only).** Pinned by the `aboutYouHelper(undefined)` test.
4. **Arrow glyph accessibility (R4).** "➜" read aloud by screen readers ("heavy wide-headed rightwards arrow") is noise. The glyph must be `aria-hidden="true"`, the same as the current dot. Checked in code review for Task 1. No automated test, since there's no DOM test harness.
5. **Nav crowding at the `lg` breakpoint (R11).** The desktop nav already fits many items, socials and Donate at 1024px, and one more button can wrap or overflow. Manual check at 1024px, 1280px and 1536px (user verifies). A mitigation is written into Task 4.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/membership/joinFlowContent.ts` | Create | Tier-card benefit lists (with bullet marker), tier descriptions, `showCalculator()`, `aboutYouHelper()` |
| `src/components/membership/joinFlowContent.test.ts` | Create | Vitest coverage for the above |
| `src/components/membership/JoinFlow.tsx` | Modify | Consume the new module; green descriptions; arrow markers; note copy; tier-aware calculator; fixed-tier helper line |
| `src/components/membership/DuesUsage.astro` | Create | Shared body of "How does T4P use dues?" (intro paragraph + green highlight with the R8 breaks) |
| `src/components/membership/MembershipMain.astro` | Modify (~lines 326-336) | Replace the inline body with `<DuesUsage />` |
| `src/pages/supporting-member.astro` | Modify (after line 253) | Add the static dues card under `#join` |
| `src/components/NavBar.svelte` | Modify (~lines 176-196, 283-285) | "Log into Hub" button, desktop and mobile |

---

### Task 1: Step 2 tier cards: copy, green descriptions, arrow bullets, reorder, note wording (R1-R5, R7)

**Files:**
- Create: `src/components/membership/joinFlowContent.ts`
- Create: `src/components/membership/joinFlowContent.test.ts`
- Modify: `src/components/membership/JoinFlow.tsx` (lines 23-38 constants; 215-282 `TierCard`; 343-372 tier cards)

**Interfaces:**
- Produces:
  - `type BenefitMarker = "dot" | "arrow"`
  - `interface TierBenefit { text: string; marker: BenefitMarker }`
  - `const MEMBER_BENEFITS: readonly TierBenefit[]`
  - `const SUPPORTING_BENEFITS: readonly TierBenefit[]`
  - `const TIER_DESCRIPTIONS: Readonly<Record<MembershipTier, string>>`

- [ ] **Step 1: Write the failing test**

`src/components/membership/joinFlowContent.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { MEMBER_BENEFITS, SUPPORTING_BENEFITS, TIER_DESCRIPTIONS } from "./joinFlowContent";

describe("tier card content", () => {
  test("descriptions use the client's short taglines", () => {
    expect(TIER_DESCRIPTIONS.member).toBe("Build the movement");
    expect(TIER_DESCRIPTIONS.supporting).toBe("Fund the movement");
  });

  test("member-only benefits come last, volunteer before chat, both with arrow markers", () => {
    const texts = MEMBER_BENEFITS.map((b) => b.text);
    expect(texts.slice(-2)).toEqual([
      "Volunteer or mentor on projects",
      "Join the private member chat",
    ]);
    expect(MEMBER_BENEFITS.slice(-2).every((b) => b.marker === "arrow")).toBe(true);
    expect(MEMBER_BENEFITS.slice(0, -2).every((b) => b.marker === "dot")).toBe(true);
  });

  test("member list keeps every existing benefit exactly once", () => {
    expect(MEMBER_BENEFITS.map((b) => b.text).sort()).toEqual(
      [
        "Dues fund Palestinian liberation initiatives",
        "Volunteer or mentor on projects",
        "Attend community events",
        "Get exclusive project updates",
        "Join the private member chat",
      ].sort(),
    );
  });

  test("supporting benefits are unchanged and all dots", () => {
    expect(SUPPORTING_BENEFITS.map((b) => b.text)).toEqual([
      "Dues fund Palestinian liberation initiatives",
      "Attend community events",
      "Get exclusive project updates",
      "(Optionally) Mentor projects",
    ]);
    expect(SUPPORTING_BENEFITS.every((b) => b.marker === "dot")).toBe(true);
  });
});
```

Also widen `vitest.config.ts`? **No.** `include: ["src/**/*.test.ts"]` already matches this path.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- src/components/membership/joinFlowContent.test.ts`
Expected: FAIL, "Failed to resolve import ./joinFlowContent".

- [ ] **Step 3: Write the minimal implementation**

`src/components/membership/joinFlowContent.ts`:

```ts
import type { MembershipTier } from "./qgiv";

export type BenefitMarker = "dot" | "arrow";

export interface TierBenefit {
  text: string;
  marker: BenefitMarker;
}

/** Tier-card bullets for the join flow's tier-selection step, distinct from
 * the shared `membershipBenefits` table used on the supporting-member pages,
 * since these are written for the compact card layout here. Member-only
 * perks sit last and take an arrow marker, so they read as "and on top of
 * that" next to the shared benefits. */
export const MEMBER_BENEFITS: readonly TierBenefit[] = [
  { text: "Dues fund Palestinian liberation initiatives", marker: "dot" },
  { text: "Attend community events", marker: "dot" },
  { text: "Get exclusive project updates", marker: "dot" },
  { text: "Volunteer or mentor on projects", marker: "arrow" },
  { text: "Join the private member chat", marker: "arrow" },
];

export const SUPPORTING_BENEFITS: readonly TierBenefit[] = [
  { text: "Dues fund Palestinian liberation initiatives", marker: "dot" },
  { text: "Attend community events", marker: "dot" },
  { text: "Get exclusive project updates", marker: "dot" },
  { text: "(Optionally) Mentor projects", marker: "dot" },
];

export const TIER_DESCRIPTIONS: Readonly<Record<MembershipTier, string>> = {
  member: "Build the movement",
  supporting: "Fund the movement",
};
```

Then in `JoinFlow.tsx`:

1. Delete the `MEMBER_BENEFITS` / `SUPPORTING_BENEFITS` constants and their doc comment (lines 23-38). Import them instead:
   ```ts
   import { MEMBER_BENEFITS, SUPPORTING_BENEFITS, TIER_DESCRIPTIONS, type TierBenefit } from "./joinFlowContent";
   ```
2. `TierCardProps.benefits` becomes `readonly TierBenefit[]`.
3. Green description (R3). Change the `tierDescription` entries in `getStyles`:
   - plain: `"text-[15px] font-semibold leading-relaxed text-[#157A3E]"`
   - designSystem: `"ts-body-small font-semibold text-[#157A3E]"`

   *Design note (impeccable):* the tagline is now a two-word identity line, not a sentence of explanation, so it carries the colour and a semibold weight. It reads as a subtitle to the tier name rather than muted helper text. Regular weight in green at 15px would look like a link.
4. Bullet rendering in `TierCard` (R4). Replace the `benefits.map` body:
   ```tsx
   {benefits.map((benefit) => (
     <li key={benefit.text} className={`flex items-baseline gap-2 ${styles.tierBenefit}`}>
       {benefit.marker === "arrow" ? (
         <span aria-hidden="true" className="shrink-0 font-semibold text-[#157A3E]">
           ➜
         </span>
       ) : (
         <span
           aria-hidden="true"
           className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-[#157A3E]"
         />
       )}
       {benefit.text}
     </li>
   ))}
   ```
   The dot uses `mt-1.5` to sit on the baseline. The arrow is a text glyph in a baseline-aligned flex row, so it aligns naturally and needs no margin.
5. Tier cards (R1/R2): `description={TIER_DESCRIPTIONS.member}` and `description={TIER_DESCRIPTIONS.supporting}`.
6. Note copy (R7), line 277:
   ```tsx
   share the same values, we do an identity and alignment check during onboarding.
   ```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- src/components/membership/joinFlowContent.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/membership/joinFlowContent.ts src/components/membership/joinFlowContent.test.ts src/components/membership/JoinFlow.tsx
git commit -m "feat(membership): tighten Step 2 tier cards (taglines, arrow perks, vetting note)"
```

---

### Task 2: Tier-aware calculator on Step 3, and a supporting-only Step 1 helper line (R6, R9)

**Files:**
- Modify: `src/components/membership/joinFlowContent.ts`
- Modify: `src/components/membership/joinFlowContent.test.ts`
- Modify: `src/components/membership/JoinFlow.tsx` (lines 205-207 helper; 394-400 calculator; `AboutYouFormProps`)

**Interfaces:**
- Consumes: `MembershipTier` from `./qgiv`
- Produces:
  - `function showCalculator(tier: MembershipTier, hideCalculator: boolean): boolean`
  - `function aboutYouHelper(fixedTier: MembershipTier | undefined): string`

- [ ] **Step 1: Write the failing tests** (append to `joinFlowContent.test.ts`, and extend the import)

```ts
import { aboutYouHelper, showCalculator } from "./joinFlowContent";

describe("showCalculator", () => {
  test("shows the calculator for members", () => {
    expect(showCalculator("member", false)).toBe(true);
  });

  test("hides the calculator for supporting members on /membership", () => {
    expect(showCalculator("supporting", false)).toBe(false);
  });

  test("hideCalculator always wins (the /supporting-member page)", () => {
    expect(showCalculator("supporting", true)).toBe(false);
    expect(showCalculator("member", true)).toBe(false);
  });
});

describe("aboutYouHelper", () => {
  test("/membership keeps the full dues line", () => {
    expect(aboutYouHelper(undefined)).toBe(
      "Dues are pay-what-you-can · Waivers available · Tax deductible in the US",
    );
  });

  test("/supporting-member drops pay-what-you-can and waivers", () => {
    expect(aboutYouHelper("supporting")).toBe("Tax deductible in the US");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/components/membership/joinFlowContent.test.ts`
Expected: FAIL, "showCalculator is not a function" / "aboutYouHelper is not a function".

- [ ] **Step 3: Implement**

Append to `joinFlowContent.ts`:

```ts
/** The dues calculator only helps someone picking a pay-what-you-can amount
 * for full membership; Supporting Members go straight to payment. */
export function showCalculator(tier: MembershipTier, hideCalculator: boolean): boolean {
  return !hideCalculator && tier === "member";
}

/** Step 1 fine print. Pay-what-you-can and waivers only apply to full
 * membership, so a flow locked to Supporting Member leaves them out. */
export function aboutYouHelper(fixedTier: MembershipTier | undefined): string {
  return fixedTier === "supporting"
    ? "Tax deductible in the US"
    : "Dues are pay-what-you-can · Waivers available · Tax deductible in the US";
}
```

In `JoinFlow.tsx`:

1. Import `aboutYouHelper, showCalculator` from `./joinFlowContent`.
2. Add `helper: string` to `AboutYouFormProps`, destructure it, and replace lines 205-207 with:
   ```tsx
   <p className={`mt-3.5 ${styles.helper}`}>{helper}</p>
   ```
   Pass `helper={aboutYouHelper(fixedTier)}` where `<AboutYouForm>` is rendered (around line 325).
3. Replace the calculator guard (line 396) with:
   ```tsx
   {showCalculator(tier, hideCalculator ?? false) && (
   ```
   `tier` is already narrowed to non-null by the enclosing `step === "payment" && tier &&`.
4. Update the `hideCalculator` prop doc comment (line 46): "Hides the dues calculator on the payment step for every tier. Used on /supporting-member. Without it the calculator still only shows for the Member tier."

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test`
Expected: PASS, including the existing `qgivVerify`, `transactionReplay`, `donation-complete` and `membership-complete` suites.

- [ ] **Step 5: Commit**

```bash
git add src/components/membership/joinFlowContent.ts src/components/membership/joinFlowContent.test.ts src/components/membership/JoinFlow.tsx
git commit -m "feat(membership): show dues calculator only for Member tier; trim supporting Step 1 fine print"
```

---

### Task 3: Shared "How does T4P use dues?" copy; new card on /supporting-member (R8, R10)

No Vitest coverage is possible for `.astro` markup under the current config, so this task is verified by review and the user's visual check.

**Files:**
- Create: `src/components/membership/DuesUsage.astro`
- Modify: `src/components/membership/MembershipMain.astro:326-336`
- Modify: `src/pages/supporting-member.astro` (import; after line 253)

**Interfaces:**
- Produces: `<DuesUsage designSystem?: boolean />`. It renders the intro paragraph and the green highlight only, with no card chrome, so each page supplies its own wrapper (an accordion `<details>` on `/membership`, a static card on `/supporting-member`).

- [ ] **Step 1: Create `DuesUsage.astro`**

```astro
---
// Body copy for "How does T4P use dues?", shared by /membership (inside its
// dues accordion) and /supporting-member (as a static card) so the wording
// can't drift between the two. Card chrome belongs to the caller.
interface Props {
  designSystem?: boolean;
}
const { designSystem = false } = Astro.props;
const body = designSystem ? "ts-body text-ink-secondary" : "text-[16px] leading-relaxed text-ink-secondary";
const highlight = designSystem ? "ts-body" : "text-[17px] leading-relaxed";
---

<p class={`mb-4 ${body}`}>
  Our independence comes from our members. By paying dues based on what you can afford, you
  sustain our operations so we stay accountable to our community and not external funders.
</p>
<div class={`space-y-2 font-bold text-[#157A3E] ${highlight}`}>
  <p>Dues sustain T4P projects:</p>
  <p>Marketing &middot; Engineering &middot; Volunteers &middot; Mentorship</p>
  <p>Via T4P staff support, software access, partnerships and grants.</p>
</div>
```

*Design note:* the client asked for "paragraph breaks", so the old `<br />` becomes three real `<p>`s with `space-y-2`. That's a tighter gap than the `mb-4` between the intro and the highlight, which keeps the three green lines reading as one block.

- [ ] **Step 2: Use it in `MembershipMain.astro`**

Add `import DuesUsage from "./DuesUsage.astro";` to the frontmatter. Replace the contents of `<div data-accordion-content class="px-6 pb-5">` (lines 327-336, both `<p>`s) with:

```astro
<DuesUsage designSystem={designSystem} />
```

Leave the `<details>`, `<summary>` and accordion attributes exactly as they are.

- [ ] **Step 3: Add the card to `supporting-member.astro`**

Add `import DuesUsage from "../components/membership/DuesUsage.astro";` to the frontmatter. Inside the same `max-w-[560px]` column as `#join`, directly after the `JoinFlow` island, wrap both in a column:

```astro
<div id="join" class="mx-auto max-w-[560px] scroll-mt-24">
  <JoinFlow client:only="react" fixedTier="supporting" hideCalculator />
  <section
    aria-labelledby="dues-usage-heading"
    class="mt-6 rounded-lg border border-ink-divider bg-white px-6 py-5 shadow-sm"
  >
    <h2 id="dues-usage-heading" class="mb-3 text-[17px] font-bold text-ink">
      How does T4P use dues?
    </h2>
    <DuesUsage />
  </section>
</div>
```

*Design note:* this matches `/membership`'s plain-variant card (`rounded-lg border border-ink-divider shadow-sm`, `px-6`, 17px bold title) but deliberately **isn't** an accordion. It's a single item with nothing to toggle, so a `+` control would only hide the copy the client wants seen. Same width as the form, so it reads as the form's footnote rather than a new section.

*Open question for the client (non-blocking):* the join step says "Tax deductible in the US" and the card says "paying dues based on what you can afford". After R9 removes "pay-what-you-can" from the form, is that phrase still wanted on the supporting page? The plan uses the client's text verbatim.

- [ ] **Step 4: Review**

Check the diff for: no `style=""`, no `-new` files touched, identical wording on both pages, and the `/membership` accordion still toggles (the `data-accordion` attributes are untouched).

- [ ] **Step 5: Commit**

```bash
git add src/components/membership/DuesUsage.astro src/components/membership/MembershipMain.astro src/pages/supporting-member.astro
git commit -m "feat(membership): share dues-usage copy and add it under the supporting-member form"
```

---

### Task 4: "Log into Hub" nav button (R11)

**Files:**
- Modify: `src/components/NavBar.svelte` (desktop right side ~176-187; mobile menu footer ~283-285)

- [ ] **Step 1: Add a constant**

In the `<script>` block of `NavBar.svelte`:

```ts
const HUB_URL = "https://hub.techforpalestine.org/";
```

- [ ] **Step 2: Desktop button, before Donate**

In the `hidden lg:flex` right-side container, between `<slot name="socials" />` and the Donate `<div>`:

```svelte
<a
  href={HUB_URL}
  class="border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold py-[10px] px-5 text-base 2xl:py-[14px] 2xl:px-8 2xl:text-lg rounded-lg transition-colors duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
>
  Log into Hub
</a>
```

*Design notes:*
- **Hierarchy:** Donate stays the one filled primary. Hub is an outlined secondary in the same green, so the two sit together without competing. It's a returning-member action, not a conversion.
- **Height match:** 2px border + `py-[10px]` equals Donate's `py-3` height, so the buttons line up.
- **Same tab, no `target="_blank"`:** logging in is a destination, not a side trip. Change this if the client prefers a new tab.
- **Crowding (Review Focus #5):** if it wraps at 1024px, add `hidden xl:inline-flex` to this desktop link and rely on the mobile-menu entry (Step 3), which shows below `lg`. Don't shrink Donate.

- [ ] **Step 3: Mobile, inside the burger menu**

The mobile header row (logo + Donate + burger) has no room. Put Hub at the bottom of the open menu, above socials. Replace lines 283-285 with:

```svelte
<a
  href={HUB_URL}
  class="mt-6 block w-full text-center border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-lg transition-colors duration-200"
>
  Log into Hub
</a>
<div class="mt-6 flex justify-center">
  <slot name="socials" />
</div>
```

Note on the two breakpoints: the mobile menu is `lg:hidden`. If the Step 2 fallback (`hidden xl:inline-flex`) is used, add a `xl:hidden` duplicate in the desktop row, or accept that 1024-1279px users can't see the button. **Recommend:** only apply the fallback if the manual check shows wrapping.

- [ ] **Step 4: Review**

- No CSP impact: it's a plain navigation link, not a fetch, so `connect-src` doesn't matter.
- `Navigation.astro` needs no change, since the button isn't part of the `navigation` map (that map drives the menu items, not CTAs).
- No sitemap or redirect changes.

- [ ] **Step 5: Commit**

```bash
git add src/components/NavBar.svelte
git commit -m "feat(nav): add Log into Hub button"
```

---

## Manual verification (user, after execution)

1. `/membership`, Step 2: the taglines are green and semibold. The Member bullets are 3 dots, then ➜ Volunteer…, then ➜ Join the private member chat. The note says "we do an identity and alignment check".
2. `/membership`, Step 3: Member shows the calculator; Supporting shows none. Pick Supporting → Step 3 → reload → pick Member → the calculator shows.
3. `/membership` dues accordion: three green lines, the last starting "Via T4P staff support…". The accordion still opens and closes.
4. `/supporting-member`, Step 1 of 2: the helper line reads only "Tax deductible in the US". There's a new static dues card under the form, and Step 2 of 2 has no calculator.
5. Nav at 375px, 1024px, 1280px and 1536px: "Log into Hub" is visible and doesn't wrap, and it opens `https://hub.techforpalestine.org/`.

## Self-review

- **Coverage:** R1-R5 and R7 → Task 1; R6 and R9 → Task 2; R8 and R10 → Task 3; R11 → Task 4. None missing.
- **Placeholders:** none. Every code step has its code.
- **Names:** `TierBenefit`, `MEMBER_BENEFITS`, `SUPPORTING_BENEFITS`, `TIER_DESCRIPTIONS`, `showCalculator`, `aboutYouHelper`, `DuesUsage` and `HUB_URL` are used consistently across tasks.
- **Review Focus:** #1-3 have tests in Task 2, #4 is a code-review check in Task 1, and #5 is a manual check with a written fallback in Task 4.
