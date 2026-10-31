import { describe, expect, it } from "vitest";
import { CAMPAIGN_ENDS_AT, isCampaignLive } from "./hackathonPopup";

const BEFORE_END = Date.parse("2026-10-20T12:00:00Z");

describe("isCampaignLive", () => {
  it("is live before the end", () => {
    expect(isCampaignLive(BEFORE_END)).toBe(true);
  });

  it("is live one millisecond before midnight after the event, Barcelona time", () => {
    expect(isCampaignLive(Date.parse("2026-10-31T22:59:59.999Z"))).toBe(true);
  });

  it("ends at midnight after the event, Barcelona time", () => {
    expect(CAMPAIGN_ENDS_AT).toBe(Date.parse("2026-10-31T23:00:00Z"));
    expect(isCampaignLive(CAMPAIGN_ENDS_AT)).toBe(false);
  });
});
