---
name: Tech for Palestine
description: A community of professionals incubating tech and advocacy projects for Palestinian liberation.
colors:
  paper: "#FFFFFF"
  stone: "#F2F3EE"
  first-light: "#E7F2E9"
  first-light-edge: "#D2E4D6"
  grove-green: "#157A3E"
  grove-green-deep: "#2F5C3F"
  nightfall: "#101010"
  ink: "#2A2428"
  ink-secondary: "#73656E"
  ink-muted: "#B5B5B5"
  ink-divider: "#D6D6D6"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(38px, 5vw, 54px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "normal"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(28px, 4vw, 38px)"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(19px, 1.5vw, 21px)"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.2
  overline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  pill: "999px"
spacing:
  section-y: "64px"
  section-y-lg: "80px"
  container-x: "24px"
  card: "24px"
  stack: "20px"
  stack-lg: "40px"
components:
  button-primary:
    backgroundColor: "{colors.grove-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.grove-green-deep}"
  button-inverse:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.nightfall}"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  band:
    backgroundColor: "{colors.first-light}"
    textColor: "{colors.ink}"
    padding: "32px 24px"
  recess:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  terminal-cta:
    backgroundColor: "{colors.nightfall}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "{spacing.stack-lg}"
---

# Design System: Tech for Palestine

## 1. Overview

**Creative North Star: "The Organizing Table"**

This system is a room where work gets planned, not a page that pitches you. Warm ink sits on white the way paper sits on a table. Green is the material at hand, the thing being cultivated and argued over. Sections advance like items on an agenda, each one banded off from the last, and exactly one dark block at the foot of the page is where the ask finally lands.

The register is brand: this is a movement's front door, and design carries the argument. But it carries it by being legible and unhurried rather than loud. Nothing here performs. A visitor who is already convinced should be able to find the next step in seconds, and a visitor who is not should be able to read the evidence without being sold to.

This system explicitly rejects the things PRODUCT.md names: cold or corporate visual language, SaaS-style tech branding with gradient blobs and glassmorphism cards, generic nonprofit design with stock photo heroes and blue-and-white palettes, vague "social good" copy that hedges on what T4P stands for, and advocacy design that leads with despair.

**Key Characteristics:**

- A single sans (Outfit) doing every job, from 12px overline to 54px display
- Warm near-black text on white, with one saturated green accent
- Alternating tinted section bands instead of an unbroken scroll
- Exactly one dark block per page, at the end, carrying the primary ask
- Grounded rather than flat: a single ambient shadow, never a stack of elevations
- Motion is restrained to state changes; nothing loops, nothing announces itself

**Provenance.** This spec documents the live site as shipped, with `/membership` as the canonical page. It replaces an earlier `DESIGN.md` that described a Fraunces-and-parchment system built for the `-new` redesign wave; that redesign was shelved in #524 and its pages are unreachable behind 301 redirects. Those tokens (`page`, `cream`, `butter`, `sand`, `brand.*`, `font-serif`) remain defined in `tailwind.config.mjs` but are **deprecated**: `bg-butter` has zero live uses, `bg-cream` has one, and Fraunces has one, all inside dead code branches. Do not reach for them.

**Known gaps.** `/membership` is a conversion flow. It models bands, cards, buttons and a terminal CTA, and nothing else. Directory and list layouts, long-form article typography, data display, dark mode, and empty and error states are **unspecified** in this system. They will be derived as pages reach them rather than invented here. `/projects` supplies the directory vocabulary first.

## 2. Colors: The Organizing Table Palette

A warm-neutral text stack on a plain white surface, with one saturated green carrying every accent and a single near-black reserved for the close.

### Primary

- **Grove Green** (`#157A3E`): The sole accent. Links, emphasized words in body copy, the primary button, card link affordances, and active states. It appears on `/membership` and on the homepage alike, which is what makes it the system's accent rather than one page's choice.
- **Grove Green Deep** (`#2F5C3F`): Overlines and eyebrows only, where the brighter green would vibrate against small uppercase letterforms at 12px.

### Secondary

- **First Light** (`#E7F2E9`): The section band. A pale green wash that separates an agenda item from the one above it without a rule or a card.
- **First Light Edge** (`#D2E4D6`): The hairline that closes a band top and bottom, and the resting border on cards inside one.

### Tertiary

- **Nightfall** (`#101010`): The terminal call to action. One block, at the foot of the page, white text on near-black with an inverse pill button. Not a text color and not a section background anywhere else.

### Neutral

- **Paper** (`#FFFFFF`): The page and card surface.
- **Stone** (`#F2F3EE`): The recessed surface. Suggested-amount panels, quiet inset notes, anything that should sit below the page rather than on it.
- **Ink** (`#2A2428`): All primary text. A warm near-black, never pure.
- **Ink Secondary** (`#73656E`): Body copy, descriptions, supporting text.
- **Ink Muted** (`#B5B5B5`): Placeholders, disabled states, metadata.
- **Ink Divider** (`#D6D6D6`): Rules and separators outside bands.

### Named Rules

**The One Green Rule.** Grove Green is the only accent. The live codebase currently contradicts this in three places and each is drift, not license: the join flow's pomegranate buttons (`#AB4956` in `QgivJoin.tsx` and `AboutYouStep.tsx`), the events page's `#EA4335`, and assorted `green-800` and `green-100` utilities that are a different green again. Converge them on `#157A3E`.

**The Single Dark Block Rule.** Exactly one Nightfall panel exists per page, and it is the last thing before the footer. Its rarity is the whole effect. A second dark section anywhere on the page destroys it.

**The Warm Ink Rule.** Text is never `#000`. Every text value carries a warm tint toward the brand hue. This holds throughout and must not regress.

**The White Surface Exception.** The page surface is pure `#FFFFFF`, which is the one place this system knowingly breaks the no-pure-values principle. It is recorded here as fact rather than defended as intent. If the surface is ever warmed, it moves site-wide in one change, not page by page.

## 3. Typography

**Display Font:** Outfit (with system-ui, sans-serif fallback)
**Body Font:** Outfit (with system-ui, sans-serif fallback)

**Character:** One humanist sans does every job. Hierarchy comes from a hard weight split rather than from a second family: headings are extrabold (800) and body is regular (400), with nothing in between at display sizes. The effect is plainspoken and a little blunt, which suits copy that refuses to hedge. Outfit is loaded at 400/500/600/700/800 in `Layout.astro` via `@fontsource`, so no weight is ever synthesized.

### Hierarchy

- **Display** (800, 38px → 54px, line-height 1.02): The page headline. Once per page. The tight leading is deliberate and is what gives the type its density.
- **Headline** (800, 28px → 38px, line-height 1.15): Section openers.
- **Title** (700, 17px, line-height 1.35): Card headings and sub-section labels.
- **Body** (400, 19px → 21px, line-height 1.625): Primary body copy. Capped at 65–75ch.
- **Body Small** (400, 16px, line-height 1.6): Secondary copy, card support text, metadata.
- **Label** (700, 13px): Button text and interactive labels.
- **Overline** (700, 12px, tracking 0.14em, uppercase): Section eyebrows in Grove Green Deep.

### Named Rules

**The Weight Gap Rule.** Headings are 800 and body is 400. The gap is the hierarchy. Reaching for 600 at a display size flattens the page and is the fastest way to make this system look generic.

**The One Family Rule.** Outfit does everything. Fraunces is deprecated and `font-serif` must not be used: `design-system.css` is loaded only by `AdminLayout`, so a serif class on a public page silently renders as the fallback.

**The Dead Class Rule.** `ts-*` utility classes are defined in `design-system.css`, which `Layout.astro` does not import. Any `ts-*` class on a public page is a no-op that renders at browser default size. Three exist today and are bugs: `eventsShared.tsx:252` and `:259`, and `AboutYouStep.tsx:101`. Never add another.

**The Line Length Rule.** Body copy never exceeds 75 characters per line. Constrain with `max-w-[65ch]` or similar, not with container padding alone.

## 4. Elevation

This system is grounded, not flat and not layered. Surfaces rest on the page with a single ambient shadow that signals "this is a distinct object" without pretending to float. Real separation comes from the tinted section bands, which do the work that a shadow stack would otherwise be asked to do.

### Shadow Vocabulary

- **Ambient** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`, Tailwind `shadow-sm`): The only sanctioned elevation. Cards, interactive surfaces, and inputs at rest.
- **Hover lift** (`shadow-sm` applied on hover to a previously flat surface): The sanctioned way for a card to acknowledge the cursor.

### Named Rules

**The One Elevation Rule.** `shadow-sm` is the vocabulary. `shadow-md`, `shadow-lg` and `shadow-xl` all appear in the live codebase and all are drift; reduce them to `shadow-sm` or to nothing when a page is next touched. A content site does not need four elevation levels.

**The Band Before Shadow Rule.** When a section needs to feel separate, band it in First Light. Reach for a shadow only when a single object needs to read as distinct from the surface directly beneath it.

## 5. Components

### Buttons

Plainspoken and sturdy. Full pill, generous hit target, label in caps-height bold, no icon unless the icon carries meaning.

- **Shape:** Full pill (`999px`). Minimum 44px tall for touch.
- **Primary:** Grove Green background, white text, 14px/20px padding, label typography. Hover deepens to Grove Green Deep.
- **Inverse:** White background, Nightfall text, same geometry. Used only inside the terminal CTA block.
- **Ghost:** Transparent, Ink text and border, same geometry. Secondary actions beside a primary.
- **Focus:** `outline-2 outline-offset-2` in Grove Green on every variant. Keyboard focus is never suppressed.

### Cards

- **Surface:** Paper, or Paper inside a First Light band.
- **Border:** 1px First Light Edge inside a band; 1px Ink Divider outside one.
- **Radius:** `rounded-lg`, which is **24px** in this project. The Tailwind defaults are overridden in `tailwind.config.mjs`; do not assume 8px.
- **Padding:** 24px.
- **Link affordance:** A bottom-aligned Grove Green label above a hairline top border, not a button.

**The No Stripe Rule.** Cards carry no colored edge stripe. The live nav cards on `/membership` use `border-t-[3px]` in Grove Green; that is drift and comes off when the page is next touched. Colored stripes on cards, top or side, are prohibited.

**The No Identical Grid Rule.** Three same-sized cards with a heading and an arrow link is the most generic shape on the web. If a set of cards is genuinely uniform, ask whether it should be a list. `/membership`'s three-card nav row is the pattern to move away from, not to copy.

### Inputs

- **Surface:** Paper, 1px Ink Divider border, `rounded-sm` (8px), `shadow-sm` at rest.
- **Focus:** Grove Green border with a 2px Grove Green ring. The live `focus:ring-red-500` on form fields is a Tailwind default that was never replaced; it is drift and reads as an error state on a valid field.
- **Placeholder:** Ink Muted.
- **Error:** Message below the field in a red that is reserved for errors and used nowhere decorative.

### Section Bands

The signature structure. A page advances as a sequence of bands rather than one continuous scroll.

- A band is First Light, closed top and bottom with a 1px First Light Edge hairline, full-bleed, with content held to the container width.
- Bands alternate with Paper sections. Two bands never touch.
- Each band opens with a Grove Green Deep overline naming the agenda item.

### Terminal CTA

One per page, at the foot. Nightfall surface, `rounded-md` (16px), generous padding, white bold copy, one inverse pill button. This is where the ask lands, and it is the only dark thing on the page.

### Navigation

`Navigation.astro`, shared by every live page through `Layout.astro`. Ink text at rest, Grove Green on hover and active, Outfit label weight throughout, one primary action at the right. Never serif.

## 6. Do's and Don'ts

### Do:

- **Do** use Grove Green (`#157A3E`) as the only accent, on links, emphasis, primary buttons and active states.
- **Do** structure a page as alternating First Light bands and Paper sections, each band opening with a Grove Green Deep overline.
- **Do** place exactly one Nightfall block per page, at the foot, carrying the primary ask.
- **Do** keep the 800/400 weight gap. Headings extrabold, body regular, nothing in between at display size.
- **Do** cap body copy at 65–75 characters per line.
- **Do** use `shadow-sm` as the only elevation, and prefer a band over a shadow when separating sections.
- **Do** use real faces, real event photos and real project logos. Stock photography is prohibited.
- **Do** state T4P's mission explicitly and early. The cause is named, never implied.
- **Do** remember `rounded-lg` is 24px here, and that Tailwind's radius defaults are overridden.

### Don't:

- **Don't** use gradient buttons or gradient backgrounds. Ten live `bg-gradient-to-r` buttons exist, including the blue CTA on `/projects`; they are drift and come off on contact. PRODUCT.md names "SaaS-style tech branding: metric dashboards, gradient blobs, glassmorphism cards" as an anti-reference.
- **Don't** use blue. PRODUCT.md names "cold or corporate" and "generic nonprofit sites: stock photo heroes, blue-and-white palettes" as anti-references. The `/about` gradient blob and the `/projects` blue CTA are both live violations.
- **Don't** use gradient text (`background-clip: text`). One solid Grove Green, with emphasis through weight or scale.
- **Don't** put a colored stripe on a card, on any edge, at any width.
- **Don't** ship three identical cards with a heading and an arrow link.
- **Don't** use a second accent. Pomegranate `#AB4956`, `#EA4335`, `green-800` and `green-100` are all drift toward `#157A3E`.
- **Don't** use `ts-*` classes or `font-serif` on a public page. Neither is loaded by `Layout.astro` and both silently degrade.
- **Don't** use the deprecated parchment tokens (`page`, `cream`, `butter`, `sand`, `brand.*`). They belong to the shelved redesign.
- **Don't** use `#000000`, and don't introduce a second dark surface.
- **Don't** reach for a modal. Exhaust inline and progressive alternatives first.
- **Don't** hedge or use vague "social good" language, and don't lead with despair. T4P is explicitly pro-Palestine and every headline should say so.
- **Don't** animate for its own sake. PRODUCT.md names "excessive complexity: no over-engineered interactions, no motion for its own sake" as an anti-reference. State changes only, and every animation guarded by `prefers-reduced-motion`.
