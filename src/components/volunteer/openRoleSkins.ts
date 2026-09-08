/**
 * The open-roles list appears on two pages built in two different visual
 * systems: `/volunteer` uses `Layout.astro` (indigo/green, white cards, system
 * font) and `/volunteer-new` uses `HomeLayout.astro` (cream/sand surfaces, rose
 * brand accent, Fraunces/Outfit via the `ts-*` scale, which is only loaded by
 * that layout). Rather than give the section a third identity of its own, each
 * skin borrows the tokens of the page hosting it.
 */
export type OpenRolesSkin = "classic" | "brand";

export interface SkinTokens {
  heading: string;
  overline: string;
  intro: string;
  count: string;
  chip: string;
  chipActive: string;
  chipIdle: string;
  card: string;
  org: string;
  orgMarker: string;
  title: string;
  pill: string;
  body: string;
  detailLabel: string;
  disclosure: string;
  applyProject: string;
  applyTeam: string;
  link: string;
  skeleton: string;
  notice: string;
  focus: string;
}

const CLASSIC: SkinTokens = {
  heading: "text-3xl font-bold text-gray-800",
  overline: "",
  intro: "text-lg text-gray-600",
  count: "text-sm text-gray-500",
  chip: "inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium transition-colors",
  chipActive: "border-indigo-600 bg-indigo-600 text-white",
  chipIdle: "border-gray-300 bg-white text-gray-600 hover:border-indigo-400 hover:text-gray-900",
  card: "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-indigo-300",
  org: "text-sm font-semibold text-indigo-600",
  orgMarker: "rounded-full border border-green-600 px-2 py-0.5 text-xs font-medium text-green-700",
  title: "text-xl font-bold text-gray-900",
  pill: "inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600",
  body: "text-base leading-relaxed text-gray-600",
  detailLabel: "text-sm font-semibold text-gray-700",
  disclosure:
    "inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline",
  applyProject:
    "inline-flex min-h-[44px] items-center rounded-full bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700",
  applyTeam:
    "inline-flex min-h-[44px] items-center rounded-full bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700",
  link: "font-medium text-indigo-600 hover:underline",
  skeleton: "rounded-2xl border border-gray-200 bg-gray-50",
  notice: "rounded-2xl border border-gray-200 bg-white p-6 text-gray-600",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
};

const BRAND: SkinTokens = {
  heading: "ts-heading text-ink",
  overline: "ts-overline text-ink-secondary",
  intro: "ts-body-large text-ink-secondary",
  count: "ts-body-small text-ink-secondary",
  chip: "ts-caption inline-flex min-h-[44px] items-center rounded-pill border px-4 transition-colors",
  chipActive: "border-brand bg-brand text-white",
  chipIdle:
    "border-ink-divider bg-transparent text-ink-secondary hover:border-brand/40 hover:text-ink",
  card: "rounded-[20px] border border-butter bg-sand p-6 transition-colors hover:border-brand/30 hover:bg-cream min-[810px]:p-8",
  org: "ts-body-small font-medium text-brand",
  orgMarker: "ts-caption rounded-pill border border-ink-divider px-2 py-0.5 text-ink-secondary",
  title: "ts-quote text-ink",
  pill: "ts-caption inline-flex items-center gap-1.5 rounded-pill border border-ink-divider px-3 py-1 text-ink-secondary",
  body: "ts-body leading-relaxed text-ink-secondary",
  detailLabel: "ts-body-small font-medium text-ink",
  disclosure:
    "ts-body-small inline-flex min-h-[44px] items-center gap-1.5 text-brand hover:underline",
  applyProject:
    "ts-label inline-flex min-h-[44px] items-center rounded-pill border border-transparent bg-brand px-5 text-white transition-all duration-150 hover:bg-brand-hover active:scale-[0.98]",
  applyTeam:
    "ts-label inline-flex min-h-[44px] items-center rounded-pill border border-ink bg-transparent px-5 text-ink transition-all duration-150 hover:bg-ink/5 active:scale-[0.98]",
  link: "font-medium text-brand hover:underline",
  skeleton: "rounded-[20px] border border-butter bg-sand",
  notice: "ts-body rounded-[20px] border border-butter bg-sand p-6 text-ink-secondary",
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
};

export function getSkinTokens(skin: OpenRolesSkin): SkinTokens {
  return skin === "brand" ? BRAND : CLASSIC;
}
