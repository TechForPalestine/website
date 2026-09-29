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
