import { describe, expect, it } from "vitest";
import {
  BRAINSTORM_ENDS_AT,
  CAMPAIGN_ENDS_AT,
  STORAGE_KEY,
  hasReachedScrollTrigger,
  isBrainstormOpen,
  isCampaignLive,
  parsePopupState,
  readPopupState,
  shouldShowPopup,
  writePopupState,
} from "./challengePopup";

const MID_NOVEMBER = Date.parse("2026-11-10T12:00:00Z");

describe("isCampaignLive", () => {
  it("is live during November", () => {
    expect(isCampaignLive(MID_NOVEMBER)).toBe(true);
  });

  it("ends at midnight CET going into December", () => {
    expect(CAMPAIGN_ENDS_AT).toBe(Date.parse("2026-11-30T23:00:00Z"));
    expect(isCampaignLive(CAMPAIGN_ENDS_AT - 1)).toBe(true);
    expect(isCampaignLive(CAMPAIGN_ENDS_AT)).toBe(false);
  });
});

describe("isBrainstormOpen", () => {
  it("is open before and during the Nov 20 session", () => {
    expect(isBrainstormOpen(MID_NOVEMBER)).toBe(true);
    expect(isBrainstormOpen(Date.parse("2026-11-20T19:45:00Z"))).toBe(true);
  });

  it("closes once the session is over, 10pm CET", () => {
    expect(BRAINSTORM_ENDS_AT).toBe(Date.parse("2026-11-20T21:00:00Z"));
    expect(isBrainstormOpen(BRAINSTORM_ENDS_AT)).toBe(false);
  });
});

describe("hasReachedScrollTrigger", () => {
  it("fires once a quarter of the page has been scrolled past the fold", () => {
    // 1000px viewport on a 5000px page: 25% of 4000 scrollable px is 1000.
    expect(hasReachedScrollTrigger(999, 1000, 5000)).toBe(false);
    expect(hasReachedScrollTrigger(1000, 1000, 5000)).toBe(true);
  });

  it("never fires on a page too short to scroll", () => {
    expect(hasReachedScrollTrigger(0, 1000, 900)).toBe(false);
  });
});

describe("parsePopupState", () => {
  it("returns null when nothing is stored", () => {
    expect(parsePopupState(null)).toBeNull();
  });

  it("reads a stored dismissal", () => {
    expect(parsePopupState('{"dismissedAt":1700000000000}')).toEqual({
      dismissedAt: 1700000000000,
    });
  });

  it.each(["not json", "null", "5", "[]", '"x"', "{}", '{"dismissedAt":"x"}'])(
    "treats %s as never dismissed",
    (raw) => {
      expect(parsePopupState(raw)).toBeNull();
    }
  );
});

describe("readPopupState / writePopupState", () => {
  it("round-trips a dismissal under the November key", () => {
    const store: Record<string, string> = {};
    writePopupState({ setItem: (key, value) => (store[key] = value) }, { dismissedAt: 42 });
    expect(Object.keys(store)).toEqual([STORAGE_KEY]);
    expect(readPopupState({ getItem: (key) => store[key] ?? null })).toEqual({ dismissedAt: 42 });
  });

  it("survives storage that is missing or throws", () => {
    const throwing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(readPopupState(null)).toBeNull();
    expect(readPopupState(throwing)).toBeNull();
    expect(() => writePopupState(throwing, { dismissedAt: 1 })).not.toThrow();
    expect(() => writePopupState(null, { dismissedAt: 1 })).not.toThrow();
  });
});

describe("shouldShowPopup", () => {
  it("shows to a visitor who never dismissed it while the campaign is live", () => {
    expect(shouldShowPopup(null, MID_NOVEMBER)).toBe(true);
  });

  it("never shows again after a dismissal", () => {
    expect(shouldShowPopup({ dismissedAt: MID_NOVEMBER - 1 }, MID_NOVEMBER)).toBe(false);
  });

  it("stops showing once the campaign is over", () => {
    expect(shouldShowPopup(null, CAMPAIGN_ENDS_AT)).toBe(false);
  });
});
