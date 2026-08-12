# Two-step "About You" gate for /membership and /supporting-member

## Problem

`/membership` and `/supporting-member` currently drop visitors straight into an
embedded Qgiv payment form (`LegacyJoinSection` → `QgivJoin`) with no
site-owned entry step. The team wants a lightweight "Step 1/2 – About You"
screen (name + email) in front of the existing payment step, matching this
wireframe:

```
Step 1/2 - About You

Name: [____________]
Email: [__________]

You'll be redirected to our secure payment partner to complete your membership.

[Next button]
```

## Non-goals

- No change to when EmailOctopus tagging happens. `/api/membership-complete`
  keeps firing only after Qgiv's `donationComplete` event, exactly as today.
  Step 1's name/email is never sent to our backend.
- No change to the Qgiv iframe embed model — payment stays embedded on-page,
  it is not a full navigation to a hosted Qgiv URL.
- No change to the MembershipCalculator A/B test, waiver panel, or Hub-invite
  logic.
- No persistence of Step 1 data across a page reload (sessionStorage/
  localStorage). Low stakes if a visitor has to re-enter name/email after a
  refresh; not worth the extra state management.
- No analytics event for this flow (explicitly out of scope for this pass).

## Design

### Where it lives

Both `/membership` (via `MembershipPage.tsx`) and `/supporting-member.astro`
already render `LegacyJoinSection` directly. The step gate is added *inside*
`LegacyJoinSection.tsx` via a new piece of state:

```ts
const [step, setStep] = useState<"about-you" | "payment">("about-you");
const [aboutYou, setAboutYou] = useState<{ name: string; email: string } | null>(null);
```

Both call sites get the new flow automatically — no changes needed at either
page or at `MembershipPage.tsx`.

### New component: `src/components/membership/AboutYouStep.tsx`

Props:

```ts
interface AboutYouStepProps {
  onContinue: (data: { name: string; email: string }) => void;
}
```

Behavior:

- Two MUI `TextField`s: **Name** (single input, matching the wireframe) and
  **Email**. Uses local `useState`, not react-hook-form — two fields don't
  justify pulling in the `hook-form` scaffolding used elsewhere in the repo.
- Copy, top to bottom: "Step 1/2 – About You" heading, the two fields, the
  line "You'll be redirected to our secure payment partner to complete your
  membership.", then a **Next** button.
- Validation runs on submit (not per-keystroke):
  - Name: required, non-empty after trim.
  - Email: required, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — the same regex
    `/api/membership-complete.ts` already validates against, so client and
    server agree on "valid email" without sharing code across the client/
    server boundary.
  - Invalid fields show inline error text beneath them; `onContinue` is not
    called until both pass.
- Visual style follows the existing `LegacyJoinSection` conventions (MUI
  `Box`/`Typography`, same color tokens: `#111827` headings, `#374151` body,
  `#168039` brand green for the button/focus ring).

### Step 2 (existing payment section), lightly extended

- Renders today's calculator/waiver/`QgivJoin` layout unchanged, plus:
  - A "Step 2/2" label above it, for continuity with Step 1.
  - A "← Edit your info" link/button that sets `step` back to `"about-you"`.
    `aboutYou` state is preserved (not cleared), so the fields are still
    filled in when the visitor goes back.

### Qgiv pre-fill

Qgiv supports pre-filling hosted/embedded form fields via a documented URL
suffix: `/v/first_name=...,last_name=...,email=...` (confirmed against
Qgiv's public API docs). We use this so a visitor doesn't retype what they
just gave us in Step 1.

- `qgiv.ts`: `qgivEmbedUrl(form, prefill?)` gains an optional third-ish
  argument (or an options object) and appends the `/v/...` suffix, URL-
  component-encoded, when `prefill` is provided.
- `QgivJoin.tsx`: gains an optional prop
  `prefill?: { firstName: string; lastName: string; email: string }`, passed
  through to `qgivEmbedUrl`.
- `LegacyJoinSection.tsx`: once `step === "payment"`, splits `aboutYou.name`
  on the first space into `firstName`/`lastName` (best-effort — a single-word
  name yields an empty `lastName`) and passes that plus `aboutYou.email` as
  `QgivJoin`'s `prefill` prop.
- This only affects Qgiv pre-fill convenience. It has no effect on
  validation, EmailOctopus data, or the Hub invite — those still come
  entirely from whatever Qgiv reports back on `donationComplete`.
- Implementation note: Qgiv's `/v/` prefill syntax is documented for their
  hosted form URLs; it hasn't been verified yet against the specific
  `/embed/<id>/` iframe src path this repo uses. Verify against a live Qgiv
  embed during implementation before relying on it, and fail open (render
  the embed without pre-fill) if the suffix doesn't take effect.

## Files touched

- `src/components/membership/AboutYouStep.tsx` (new)
- `src/components/membership/LegacyJoinSection.tsx` (step state, wiring)
- `src/components/membership/QgivJoin.tsx` (optional `prefill` prop)
- `src/components/membership/qgiv.ts` (`qgivEmbedUrl` prefill support)

No API routes, EmailOctopus config, or page-level files (`membership.astro`,
`supporting-member.astro`, `MembershipPage.tsx`) need to change.
