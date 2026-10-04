import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_ENDS_AT,
  STORAGE_KEY,
  isCampaignLive,
  parsePopupState,
  readPopupState,
  shouldShowPopup,
  writePopupState,
} from "./hackathonPopup";

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

describe("parsePopupState", () => {
  it("returns null when nothing is stored", () => {
    expect(parsePopupState(null)).toBeNull();
  });

  it("reads a stored dismissal", () => {
    expect(parsePopupState('{"dismissedAt":1700000000000}')).toEqual({ dismissedAt: 1700000000000 });
  });

  it.each(["not json", "null", "5", "[]", '"x"', "{}", '{"dismissedAt":"x"}', '{"dismissedAt":null}'])(
    "treats %s as never dismissed",
    (raw) => {
      expect(parsePopupState(raw)).toBeNull();
    }
  );
});

describe("readPopupState", () => {
  it("reads from storage under the hackathon key", () => {
    const storage = { getItem: (key: string) => (key === STORAGE_KEY ? '{"dismissedAt":1}' : null) };
    expect(readPopupState(storage)).toEqual({ dismissedAt: 1 });
  });

  it("returns null when storage is unavailable", () => {
    expect(readPopupState(null)).toBeNull();
  });

  it("returns null when storage throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readPopupState(storage)).toBeNull();
  });
});

describe("writePopupState", () => {
  it("writes the dismissal as JSON under the hackathon key", () => {
    const written: Record<string, string> = {};
    writePopupState({ setItem: (key, value) => (written[key] = value) }, { dismissedAt: 42 });
    expect(written).toEqual({ [STORAGE_KEY]: '{"dismissedAt":42}' });
  });

  it("does not throw when storage throws or is unavailable", () => {
    const storage = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => writePopupState(storage, { dismissedAt: 1 })).not.toThrow();
    expect(() => writePopupState(null, { dismissedAt: 1 })).not.toThrow();
  });
});

describe("shouldShowPopup", () => {
  it("shows to a visitor who never dismissed it while the campaign is live", () => {
    expect(shouldShowPopup(null, BEFORE_END)).toBe(true);
  });

  it("never shows again after any dismissal", () => {
    expect(shouldShowPopup({ dismissedAt: BEFORE_END - 1 }, BEFORE_END)).toBe(false);
  });

  it("never shows after the campaign ends", () => {
    expect(shouldShowPopup(null, CAMPAIGN_ENDS_AT)).toBe(false);
  });
});
