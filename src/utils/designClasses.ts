// Shared class strings for the live design system (DESIGN.md, "The Organizing
// Table"). Layout.astro does not load design-system.css, so public pages
// express the type scale and components in plain Tailwind. Import from here
// instead of redefining them per page so the system cannot drift.
//
// Tailwind scans src/**/*.ts, so classes written here are generated as long
// as they stay complete literal strings (no runtime concatenation of partial
// class names).

/** Page-width container: 1280px max, 24px gutters. */
export const container = "mx-auto max-w-[1280px] px-6";

/** Display (DESIGN.md §3): the page H1, once per page. */
export const display =
  "text-[38px] font-extrabold leading-[1.05] text-ink min-[810px]:text-[54px] min-[810px]:leading-[1.02]";

/** Headline: section openers. */
export const headline =
  "text-[28px] font-extrabold leading-[1.15] text-ink min-[810px]:text-[38px]";

/** Overline: section eyebrows in Grove Green Deep. */
export const overline = "text-xs font-bold uppercase tracking-[0.14em] text-grove-deep";

/** Body: primary copy size. Pair with a colour and a max-w-[65ch] cap. */
export const body = "text-[19px] leading-relaxed min-[810px]:text-[21px]";

/** First Light section band, closed top and bottom by a hairline. */
export const band = "border-y border-first-light-edge bg-first-light";

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove";
export const focusRingOnDark =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const pillBase =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-5 py-3 text-[13px] font-bold transition-colors motion-reduce:transition-none";

/** Pill geometry for light surfaces; add a colour variant. */
export const pill = `${pillBase} ${focusRing}`;
/** Pill geometry for the Nightfall block; add a colour variant. */
export const pillOnDark = `${pillBase} ${focusRingOnDark}`;

export const primaryButton = `${pill} bg-grove text-white hover:bg-grove-hover`;
export const ghostButton = `${pill} border border-ink text-ink hover:border-grove hover:text-grove`;
/** Inverse: white pill, used only inside the terminal CTA. */
export const inverseButton = `${pillOnDark} bg-white text-nightfall hover:bg-first-light`;
/** Ghost on dark: secondary action beside the inverse button. */
export const ghostOnDarkButton = `${pillOnDark} border border-white/45 text-white hover:border-white hover:bg-white hover:text-nightfall`;

export const inlineLink = `font-bold text-grove underline decoration-grove/40 underline-offset-4 transition-colors hover:decoration-grove motion-reduce:transition-none ${focusRing}`;
export const inlineLinkOnDark = `font-bold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white motion-reduce:transition-none ${focusRingOnDark}`;
