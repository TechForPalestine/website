/**
 * The open-roles list appears on two pages built in two different visual
 * systems: `/volunteer` uses `Layout.astro` (the live DESIGN.md system: Grove
 * Green on white cards inside a First Light band) and `/volunteer-new` uses
 * `HomeLayout.astro` (cream/sand surfaces, rose brand accent, Fraunces/Outfit via the `ts-*` scale, which is only loaded by
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
  heading:
    "text-[28px] font-extrabold leading-tight tracking-tight text-ink min-[810px]:text-[38px]",
  overline: "",
  intro: "text-[19px] leading-relaxed text-ink min-[810px]:text-[21px]",
  count: "text-[16px] text-ink-secondary",
  chip: "inline-flex min-h-[44px] items-center rounded-full border px-4 text-[15px] font-bold transition-colors duration-150 motion-reduce:transition-none",
  chipActive: "border-[#157A3E] bg-[#157A3E] text-white",
  chipIdle: "border-[#D2E4D6] bg-white text-ink hover:border-[#157A3E] hover:text-[#157A3E]",
  card: "rounded-lg border border-[#D2E4D6] bg-white p-6 transition-shadow duration-150 hover:shadow-sm motion-reduce:transition-none sm:p-7",
  org: "text-[15px] font-bold text-[#2F5C3F]",
  orgMarker: "rounded-full border border-[#157A3E] px-2.5 py-0.5 text-xs font-bold text-[#157A3E]",
  title: "text-xl font-extrabold tracking-tight text-ink",
  pill: "inline-flex items-center gap-1.5 rounded-full bg-[#F2F3EE] px-3 py-1 text-[13px] font-bold text-ink-secondary",
  body: "text-[17px] leading-relaxed text-ink-secondary",
  detailLabel: "text-[15px] font-bold text-ink",
  disclosure:
    "inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-bold text-[#157A3E] underline decoration-1 underline-offset-4 hover:text-[#0e5a2f]",
  applyProject:
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-ink bg-white px-5 text-[15px] font-bold text-ink transition-colors duration-150 hover:bg-[#F2F3EE] motion-reduce:transition-none",
  applyTeam:
    "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#157A3E] px-5 text-[15px] font-bold text-white shadow-sm transition-colors duration-150 hover:bg-[#0e5a2f] motion-reduce:transition-none",
  link: "font-bold text-[#157A3E] underline decoration-1 underline-offset-4 hover:text-[#0e5a2f]",
  skeleton: "rounded-lg border border-[#D2E4D6] bg-white/60",
  notice: "rounded-lg border border-[#D2E4D6] bg-white p-6 text-[17px] text-ink-secondary",
  focus:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#157A3E] focus-visible:ring-offset-2",
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
