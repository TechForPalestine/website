---
name: Tech for Palestine
description: A community of professionals incubating tech and advocacy projects for Palestinian liberation.
colors:
  page: "#FFFBF5"
  cream: "#FBF2ED"
  butter: "#F7EAD4"
  sand: "#F7F2E8"
  ink: "#2A2428"
  ink-dark: "#201D1E"
  ink-secondary: "#73656E"
  ink-muted: "#B5B5B5"
  ink-divider: "#D6D6D6"
  logo-frame: "#EFE3D4"
  brand: "#AB4956"
  brand-hover: "#D35464"
  brand-light: "#E8727F"
typography:
  display:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(42px, 5vw, 60px)"
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: "normal"
  headline:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(36px, 4vw, 48px)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Fraunces, serif"
    fontSize: "clamp(32px, 3vw, 38px)"
    fontWeight: 400
    lineHeight: 1.22
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(16px, 1.5vw, 20px)"
    fontWeight: 400
    lineHeight: 1.48
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.12em"
rounded:
  sm: "8px"
  md: "16px"
  lg: "24px"
  pill: "999px"
spacing:
  section-y: "96px"
  section-y-lg: "128px"
  container-x: "24px"
  container-x-md: "40px"
  card: "24px"
  card-md: "40px"
  card-lg: "56px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
    typography: "{typography.label}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    rounded: "0"
    padding: "0"
    typography: "{typography.label}"
  portfolio-card:
    backgroundColor: "{colors.sand}"
    rounded: "20px"
    padding: "{spacing.card}"
  stats-cell:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
---

# Design System: Tech for Palestine

## 1. Overview

**Creative North Star: "The Steadfast Press"**

This system is built like a publication produced by people who care deeply: warm paper stock, purposeful type, nothing decorative that doesn't earn its place. The Fraunces serif carries editorial authority; Outfit brings it back down to earth. The palette reads like late-afternoon light on linen, not a tech product, not a protest poster.

The design is warm without being sentimental, serious without being cold, and direct without being aggressive. It reflects a community of skilled professionals who know what they're doing and aren't apologetic about why. Complexity is prohibited not because the cause is simple, but because clarity is respect for the visitor's time and attention.

This system explicitly rejects: SaaS gradient aesthetics, corporate nonprofit polish, excessive motion or interactivity, vague social-good language, and anything that hedges on what T4P stands for.

**Key Characteristics:**
- Editorial serif (Fraunces) paired with a clean humanist sans (Outfit)
- Warm parchment neutrals with a single pomegranate accent, used sparingly
- Flat-by-default surfaces with tonal depth through background steps (page → cream → sand → butter)
- Motion is restrained: entrances only, no looping decorative animation, always `prefers-reduced-motion` safe
- CTAs appear where they are contextually earned, not mandated at the end of every section

## 2. Colors: The Parchment and Pomegranate Palette

A warm neutral stack grounded in off-white parchment, with a single saturated accent used only where it signals action or emphasis. The palette reads as editorial, human, and grounded — not tech-blue, not activist-red, not nonprofit-green.

### Primary
- **Pomegranate** (`#AB4956`): The sole accent. Used on CTAs, active states, brand emphasis, and the `text-brand` utility class. Forbidden as a background for large surface areas. Its rarity is its power.
- **Pomegranate Light** (`#D35464`): Hover state only. Never appears at rest. Lighter than base for a lift feel.

### Neutral
- **Warm Parchment** (`#FFFBF5`): The page background. The surface everything rests on. Never pure white.
- **Cream** (`#FBF2ED`): Slightly elevated surface — light card backgrounds, hover fills.
- **Butter** (`#F7EAD4`): Card borders, warm dividers, the rotated accent behind logo frames.
- **Sand** (`#F7F2E8`): Recessed surfaces — stats grids, input backgrounds.
- **Ink** (`#2A2428`): All primary text. Warm near-black, never pure black.
- **Ink Dark** (`#201D1E`): The one dark surface. Backs the closing CTA block (`CtaSection`) so the final call to action inverts against the parchment page. Not a text color; a full-bleed dark panel. Text on it is parchment (`page`) and `brand-light`.
- **Ink Secondary** (`#73656E`): Body copy, descriptions, supporting text.
- **Ink Muted** (`#B5B5B5`): Placeholders, disabled states, metadata.
- **Ink Divider** (`#D6D6D6`): Horizontal rules, section separators.
- **Logo Frame** (`#EFE3D4`): The warm rotated accent panel behind portfolio logo frames. A shade deeper than Butter so the frame reads against Sand card surfaces.

### Brand on Dark
- **Pomegranate Light** (`#E8727F`): The accent on the dark CTA surface only. Pomegranate at rest is too dark to carry emphasis against `ink-dark`; this lifted tint is the on-dark counterpart (distinct from `brand-hover` `#D35464`, which is a light-surface hover state).

### Named Rules
**The One Accent Rule.** Pomegranate appears on less than 10% of any screen. It marks action and emphasis only. A second accent would dilute it to decoration.

**The Single Dark Surface Rule.** Exactly one dark panel exists: the closing CTA (`ink-dark` `#201D1E`). It earns its inversion by being the terminal call to action. Do not introduce dark sections elsewhere; the system is parchment-light by default and the dark block's rarity is what makes it land.

**The Tonal Depth Rule.** Depth is created by stepping through the neutral stack (Parchment → Cream → Sand → Butter), not by drop shadows on every surface. Shadows are reserved for interactive elements that need structural lift.

**The No Pure Values Rule.** Never use `#000000` or `#ffffff`. Every neutral carries a warm tint toward the brand hue. Pure values feel clinical; tinted neutrals feel inhabited.

## 3. Typography

**Display Font:** Fraunces (with Fraunces Placeholder, serif fallback)
**Body Font:** Outfit (with system-ui, sans-serif fallback)

**Character:** Fraunces carries optical weight and editorial warmth — it reads like a serious publication, not a startup homepage. Outfit is clean and humanist, grounding the editorial tone in clarity. Neither font performs. Together they communicate: "people who know what they're doing built this."

The scale is **fixed-step, not fluid.** Sizes snap at three breakpoints (390 base / 810 / 1200) rather than using `clamp()`; the clamp values in the frontmatter are min→max endpoint approximations of that stepped scale. Every role is a `.ts-*` utility class defined in `src/styles/design-system.css`.

#### Fraunces (editorial roles)
- **Display** (`.ts-display`, 400, 42→52→60px, line-height 1.22): Hero headline. Used once per page. The largest typographic statement.
- **Editorial** (`.ts-editorial`, 400, 36→42→48px, line-height 1.18, tracking –0.01em): Section-opening statements. Manifesto headline, portfolio section header. Slightly tighter tracking for editorial character. (Frontmatter `headline`.)
- **Stat / Stat Large** (`.ts-stat` 36→42→48px, `.ts-stat-large` 42→52→60px, line-height 1.22/1): The proof-point numbers (80+, 10,000+). Fraunces, so stats read as editorial evidence, not a SaaS metric grid.
- **Heading** (`.ts-heading`, 400, 32→36→38px, line-height 1.22): Project names in portfolio cards, sub-section headings. (Frontmatter `title`.)
- **Subheading** (`.ts-subheading`, 400, 28→30→32px): Tertiary headings within sections.
- **Quote** (`.ts-quote`, 400, 22→24→26px, line-height 1.32): Pull quotes, testimonials.
- **Eyebrow** (`.ts-eyebrow`, 400, 18→19→24px, line-height 1.32): A Fraunces editorial annotation above a headline. This is a serif eyebrow, NOT the uppercase-tracked label — for that, see Overline below.

#### Outfit (interface roles)
- **Body Large** (`.ts-body-large`, 400, 18→20px, line-height 1.48): Primary body copy. Section and project descriptions. Line length capped at 65–75ch. (Frontmatter `body`.)
- **Body** (`.ts-body`, 400, 16→18px, line-height 1.22): Secondary body copy, card support text. Prefer Body Large where possible.
- **Body Small / Caption** (`.ts-body-small` 14→16px, `.ts-caption` 14px): Metadata, fine print.
- **Label** (`.ts-label`, 500, 16→18px, line-height 1): Button text and interactive labels. Used by `Button.astro`.
- **Overline** (`.ts-overline`, 500, 12px, tracking 0.12em, uppercase): Section eyebrows, `— OUR PORTFOLIO` style annotations. All uppercase, generous tracking. (Frontmatter `label`.)

### Named Rules
**The Fraunces Hierarchy Rule.** Fraunces owns display, editorial, stat, heading, subheading, quote, and the serif eyebrow. Outfit owns all interface text: body, label, overline, caption. The serif never appears in a button, an overline, or interface chrome; the sans never appears in a headline or a stat. This editorial/UI split is the system's spine.

**The Line Length Rule.** Body copy never exceeds 75 characters per line. On wide viewports, constrain with `max-w-[75ch]` or equivalent, not just container padding.

## 4. Elevation

This system is flat by default. Surfaces rest without shadow; the tonal neutral stack (parchment → cream → sand → butter) creates perceived depth through background steps, not drop shadows.

Shadows appear in two specific contexts only: (1) interactive elements that need structural lift to signal they are "above" the page (logo frames in portfolio cards), and (2) the hero glass card overlay, which uses a semi-transparent white backdrop rather than a traditional shadow.

### Shadow Vocabulary
- **Logo Frame Ambient** (`0 6px 20px rgba(0,0,0,0.06)`): The rotated Butter accent behind logo frames. Provides depth without weight. Never used on text containers.
- **Logo Frame Lift** (`0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05)`): The logo card itself. Layered shadow creates subtle three-dimensional presence.
- **Ink Ring** (`--color-ink-ring`, `rgba(42,36,40,0.12)`): A hairline warm ring for resting surface edges (inputs, framed elements) where a full `ink-divider` border would read too hard. Not a drop shadow; a low-contrast boundary. Interactive focus uses the Pomegranate outline (`outline-brand`), not this.

### Named Rules
**The Flat-By-Default Rule.** A surface that doesn't move does not get a shadow. If adding a shadow is the first instinct, ask whether a background step (parchment → sand) solves the same problem without visual noise.

## 5. Components

### Buttons

Clean pill form. The shape is soft but the intent is direct. Two meaningful variants; a third for inline text links.

- **Shape:** Fully rounded pill (999px radius). Softness signals approachability, not weakness.
- **Primary:** Pomegranate background (`#AB4956`), White text (`#FFFFFF` — max contrast on brand surface), Outfit 500 label weight, 14px 20px padding. Hover lightens to Pomegranate Light (`#D35464`). Active state compresses to 98% scale.
- **Ghost:** Transparent background, Ink border and text, same pill shape and padding as Primary. Hover fills with `ink/5` (5% ink tint). Used for secondary actions alongside a Primary CTA.
- **Text:** No border, no background. Pomegranate text, no radius. Underlines on hover. Used inline in body copy or as a tertiary option.
- **Focus:** `outline-2 outline-offset-2 outline-brand` for all variants. Keyboard navigation must be visually unambiguous.

### Cards / Containers

The portfolio card is the signature container of this system. It is not a standard card grid — each card is a full-width editorial strip with intentional layout.

- **Portfolio Card:** Sand background, Butter border (1px), 20px radius, internal padding steps (24px mobile / 40px tablet / 56px desktop). Two-column grid on desktop (text left, logo right). Cards stack with a scroll-scale depth effect on desktop.
- **Stats Cell:** Sand background, no border, no shadow. Stats live on the tonal surface without additional framing.
- **Logo Frame:** Butter rotated accent (–3deg) behind a white foreground frame. The rotation is the design element. Ambient shadow only.

**The No Nested Card Rule.** Never place a card inside a card. The logo frame within a portfolio card is a logo display element, not a card — it has no interactive behavior and no content hierarchy of its own.

### Navigation

`HomeNavbar.astro` is a fixed-top bar (`fixed top-0 z-50`) over the parchment page. Structure: a horizontal list of top-level items (About, Incubator, Get Involved, Events, Updates), each opening a dropdown mega-menu of children, with a single Pomegranate primary CTA button (`Button.astro`, `variant="primary"`) anchored at the right.

- **Typography:** Outfit label weight (`.ts-label` / `.ts-overline` for menu items). Never Fraunces.
- **Text:** Ink at rest, Pomegranate for active/hover.
- **Active state:** an item is active when the current path matches its href or any child href (`isGroupActive`). No underline; color shift only.
- **CTA:** exactly one Pomegranate button in the bar. All other nav items are text links.
- **Visibility:** supports an `alwaysVisible` mode; otherwise reveals on scroll (`data-always-visible`).

### Signature Components

**Portfolio Stack:** Six portfolio cards rendered as a sticky-scroll stack. On desktop, each card stacks behind the one above it using `position: sticky` with staggered `top` offsets (40px, 64px, 88px...) and a scroll-driven scale reduction (minimum 0.88). Cards enter with a `translateY(32px) → 0` fade. This is the design centerpiece of the homepage — do not simplify it to a carousel or grid.

**Collage Cluster:** Four photos in a tight cluster with rotations (–8deg, +6deg, –5deg, +7deg), absolutely positioned to overlap a recessed stats grid. The collage is decorative evidence of community and events. Motion: ken-burns scale pulse (1→1.08→1, 14s, ease-in-out). Always `motion-reduce:animate-none`.

**Motif Row:** Overlapping T4P logos with staggered fade-left entrance. Negative margin creates the overlap (`-space-x-[18px→22px→30px]`). Purely decorative; `aria-hidden`.

## 6. Do's and Don'ts

### Do:
- **Do** use Pomegranate (`#AB4956`) only on CTAs, brand emphasis, and active states. Its scarcity is its meaning.
- **Do** step through the neutral stack (Parchment → Cream → Sand → Butter) to create depth rather than adding shadows.
- **Do** use Fraunces exclusively for display, headline, and title roles. Outfit owns all body, label, and interface text.
- **Do** cap body text at 65–75ch line length on all viewport widths.
- **Do** guard every animation with `prefers-reduced-motion`. The CSS blanket `* { animation: none !important }` must be replaced with per-element guards.
- **Do** place CTAs where they are contextually earned — after evidence, after a clear invitation, not mechanically at the end of every section.
- **Do** use real faces, real event photos, and real project logos. Stock photography is prohibited.
- **Do** state T4P's mission explicitly and early. The cause is not implied; it is named.
- **Do** use the portfolio stack component (sticky scroll with depth) for featured projects. It is the homepage's signature interaction.

### Don't:
- **Don't** use excessive interactivity or motion. Clarity of communication takes priority over visual spectacle. If an animation doesn't aid comprehension, remove it.
- **Don't** hedge or use vague "social good" language. T4P is explicitly pro-Palestine. Every headline must say so.
- **Don't** use cold or corporate visual language: blues, grays, geometric icons, or corporate-sans typography. This is a community, not a product.
- **Don't** use gradient text (`background-clip: text`). Use a single solid Pomegranate. Emphasis through weight or scale.
- **Don't** use side-stripe borders (`border-left > 1px` as a colored accent). Use full borders, background tints, or nothing.
- **Don't** repeat the hero metric pattern (big number, small label, supporting stats, gradient accent). The stats exist as proof points, not as a SaaS feature grid.
- **Don't** use glassmorphism as a decorative default. The hero glass card is purposeful (it must be legible over a full-bleed image). Everywhere else: solid tonal surfaces only.
- **Don't** use `#000000` or `#ffffff`. Every neutral is warm-tinted.
- **Don't** add a shadow to a surface that does not move or need structural lift. Flat surfaces stay flat.
- **Don't** use generic nonprofit design: blue-and-white palettes, stock photo heroes, "we believe in a better world" copy.
