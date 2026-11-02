// Campaign window for the Hackathon 2026 promo on /monthly-challenge.

// Midnight after the event, Barcelona time (CET: DST ends on Oct 25).
export const CAMPAIGN_ENDS_AT = Date.parse("2026-11-01T00:00:00+01:00");

export function isCampaignLive(now: number): boolean {
  return now < CAMPAIGN_ENDS_AT;
}
