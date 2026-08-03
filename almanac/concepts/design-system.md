---
title: "The \"Steadfast Press\" Design System"
summary: "The token spec and named rules — Parchment and Pomegranate colors, a Fraunces/Outfit type split, and rules like the One Accent Rule — that govern every -new redesigned page but not the legacy site."
topics: [architecture, design, frontend]
sources:
  - id: design-md
    type: file
    path: DESIGN.md
  - id: tailwind-config
    type: file
    path: tailwind.config.mjs
  - id: design-system-css
    type: file
    path: src/styles/design-system.css
  - id: product-md
    type: file
    path: PRODUCT.md
---

"The Steadfast Press" is the name `DESIGN.md` gives to the visual language behind the T4P website's redesign: a warm, editorial palette called "Parchment and Pomegranate," a serif/sans typographic split, and a set of named rules that constrain how far any single page is allowed to deviate from the system [@design-md]. It is not the visual language of the site as a whole — it governs only the [`-new` pages](the-new-page-pattern) (`src/components/home/*` and their siblings), while the legacy pages still use the older, unrelated Tailwind styling visible in files like `index.astro`. Reading `DESIGN.md` is the fastest way to understand what a redesigned page is *supposed* to look like before touching its markup.

## Where the tokens actually live

`DESIGN.md` opens with a YAML frontmatter block defining colors, typography, radii, spacing, and component tokens as the canonical spec [@design-md]. `tailwind.config.mjs` implements a subset of that spec directly as Tailwind theme extensions: the `page`/`cream`/`butter`/`sand` neutrals, the `ink.*` and `brand.*` color scales, the `Fraunces`/`Outfit` font families, and the `sm`/`md`/`lg`/`pill` border radii all match the frontmatter values exactly [@tailwind-config] [@design-md].

The typography *scale* — the actual pixel sizes, line-heights, and letter-spacing for each named text role — is not in `tailwind.config.mjs` at all. `DESIGN.md` states the scale is "fixed-step, not fluid," snapping at three breakpoints (390/810/1200px) rather than using CSS `clamp()`, and that "every role is a `.ts-*` utility class defined in `src/styles/design-system.css`" [@design-md]. That file backs up the claim: classes like `.ts-editorial`, `.ts-display`, `.ts-body-large`, `.ts-label`, and `.ts-overline` are defined there, each with breakpoint-specific rules, rather than as Tailwind `theme.extend.fontSize` entries [@design-system-css]. A component built from Tailwind's default type scale instead of a `.ts-*` class is not following the system, even if its colors and radii are correct.

`tailwind.config.mjs` still carries a `red` and a `green` color palette (10 shades each) that appear nowhere in `DESIGN.md` and have no relationship to the Pomegranate/Ink palette [@tailwind-config] [@design-md]. These are leftovers from the pre-redesign site's styling and are not part of the Steadfast Press system — a stray `bg-green-600` in new code is a sign the token system wasn't consulted, not a legitimate use of an approved color.

## The named rules

`DESIGN.md` encodes its constraints as explicit, quotable rules rather than loose guidance, so a reviewer can check a component against a specific sentence instead of a vibe:

- **The One Accent Rule** — the Pomegranate brand color (`#AB4956`) covers less than 10% of any screen and is reserved for CTAs, active states, and emphasis. It is forbidden as a large background surface [@design-md].
- **The Single Dark Surface Rule** — exactly one dark panel exists anywhere in the system: the closing CTA block, using `ink-dark` (`#201D1E`). No other section is allowed to invert to a dark background [@design-md].
- **The Tonal Depth Rule** — perceived depth comes from stepping through the neutral stack (Parchment → Cream → Sand → Butter), not from `box-shadow` on every surface [@design-md].
- **The No Pure Values Rule** — `#000000` and `#ffffff` are never used; every neutral, including `ink` and `page`, carries a warm tint [@design-md].
- **The Fraunces Hierarchy Rule** — the Fraunces serif owns display, editorial, stat, heading, subheading, quote, and eyebrow roles; the Outfit sans owns everything interface-facing — body copy, labels, overlines, captions. Neither font crosses into the other's territory [@design-md].
- **The Line Length Rule** — body copy never exceeds 65–75 characters per line, enforced with `max-w-[75ch]` or equivalent rather than relying on container padding alone [@design-md].
- **The Flat-By-Default Rule** — a surface that isn't interactive gets no shadow; if a shadow feels necessary, the fix is usually another step in the neutral stack instead [@design-md].
- **The No Nested Card Rule** — a card is never placed inside another card; a decorative element like a portfolio card's rotated logo frame doesn't count as a nested card because it carries no independent content hierarchy [@design-md].

These rules exist because the system is deliberately narrow by design. `DESIGN.md`'s own framing states the system "explicitly rejects" SaaS gradient aesthetics, corporate nonprofit polish, and vague social-good language [@design-md] — language that echoes the brand brief in `PRODUCT.md`, which names the same anti-references (stock-photo nonprofit sites, SaaS metric dashboards, glassmorphism) and states the design system's purpose is to fix a lack of visual cohesion across the site [@product-md]. The rules are what keep a new component from drifting back toward those rejected patterns one convenient shortcut at a time — reaching for a drop shadow, adding a second accent color, or letting Fraunces slip into a button label are each a specific, named violation rather than a vague style regression.
