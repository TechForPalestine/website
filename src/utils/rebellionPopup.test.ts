import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_ENDS_AT,
  STORAGE_KEY,
  countdownLabel,
  daysUntilEvent,
  isCampaignLive,
  parsePopupState,
  readPopupState,
  shouldShowPopup,
  writePopupState,
} from "./rebellionPopup";

const NOV_2 = Date.parse("2026-11-02T12:00:00+01:00");

describe("isCampaignLive", () => {
  it("is live before the event", () => {
    expect(isCampaignLive(NOV_2)).toBe(true);
  });

  it("is live one millisecond before midnight after the event, Berlin time", () => {
    expect(isCampaignLive(Date.parse("2026-12-12T22:59:59.999Z"))).toBe(true);
  });

  it("ends at midnight after the event, Berlin time", () => {
    expect(CAMPAIGN_ENDS_AT).toBe(Date.parse("2026-12-12T23:00:00Z"));
    expect(isCampaignLive(CAMPAIGN_ENDS_AT)).toBe(false);
  });
});

describe("countdown", () => {
  it("counts whole days to the event", () => {
    expect(daysUntilEvent(Date.parse("2026-12-02T00:00:00+01:00"))).toBe(10);
    expect(countdownLabel(NOV_2)).toBe("40 days to go");
  });

  it("says tomorrow the day before and today on the day", () => {
    expect(countdownLabel(Date.parse("2026-12-11T09:00:00+01:00"))).toBe("Tomorrow");
    expect(countdownLabel(Date.parse("2026-12-12T09:00:00+01:00"))).toBe("Happening today");
  });
});

describe("popup state", () => {
  it("shows when nothing is stored and the campaign is live", () => {
    expect(shouldShowPopup(null, NOV_2)).toBe(true);
  });

  it("stays hidden after a dismissal or once the campaign ends", () => {
    expect(shouldShowPopup({ dismissedAt: 1 }, NOV_2)).toBe(false);
    expect(shouldShowPopup(null, CAMPAIGN_ENDS_AT)).toBe(false);
  });

  it("ignores malformed stored values", () => {
    for (const raw of ["", "nope", "[]", "null", '{"dismissedAt":"x"}']) {
      expect(parsePopupState(raw)).toBeNull();
    }
    expect(parsePopupState('{"dismissedAt":5}')).toEqual({ dismissedAt: 5 });
  });

  it("round-trips through storage and tolerates a throwing store", () => {
    const data: Record<string, string> = {};
    const store = {
      getItem: (k: string) => data[k] ?? null,
      setItem: (k: string, v: string) => void (data[k] = v),
    };
    writePopupState(store, { dismissedAt: 7 });
    expect(data[STORAGE_KEY]).toBe('{"dismissedAt":7}');
    expect(readPopupState(store)).toEqual({ dismissedAt: 7 });

    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readPopupState(broken)).toBeNull();
    expect(() => writePopupState(broken, { dismissedAt: 1 })).not.toThrow();
  });
});
