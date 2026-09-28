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
