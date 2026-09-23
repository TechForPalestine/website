import { describe, expect, it } from "vitest";
import {
  DISMISS_SUPPRESS_MS,
  EMBED_MESSAGE_SOURCE,
  MAX_EMBED_HEIGHT,
  POPUP_STORAGE_KEY,
  hasReachedScrollTrigger,
  isSuppressed,
  parseEmbedMessage,
  parsePopupState,
  readPopupState,
  toEmbedPayload,
  writePopupState,
} from "./newsletterPopup";

const NOW = Date.UTC(2026, 8, 23);
const DAY = 24 * 60 * 60 * 1000;

describe("parsePopupState", () => {
  it("returns null when nothing is stored", () => {
    expect(parsePopupState(null)).toBeNull();
  });

  it("reads a dismissal timestamp", () => {
    expect(parsePopupState(JSON.stringify({ dismissedAt: NOW }))).toEqual({ dismissedAt: NOW });
  });

  it("reads a subscription", () => {
    expect(parsePopupState(JSON.stringify({ subscribed: true }))).toEqual({ subscribed: true });
  });

  it.each(["not json", "null", "42", '"x"', "[]", '{"dismissedAt":"yesterday"}', '{"subscribed":"yes"}'])(
    "treats a corrupt or foreign value %s as unset",
    (raw) => {
      expect(parsePopupState(raw)).toBeNull();
    }
  );
});

describe("readPopupState / writePopupState", () => {
  it("round-trips through storage under the popup key", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    writePopupState(storage, { dismissedAt: NOW });
    expect(store.has(POPUP_STORAGE_KEY)).toBe(true);
    expect(readPopupState(storage)).toEqual({ dismissedAt: NOW });
  });

  it("returns null when there is no storage", () => {
    expect(readPopupState(null)).toBeNull();
  });

  it("returns null instead of throwing when storage access throws", () => {
    const throwing = {
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(readPopupState(throwing)).toBeNull();
  });

  it("swallows write errors so the popup still closes", () => {
    const throwing = {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    };
    expect(() => writePopupState(throwing, { subscribed: true })).not.toThrow();
    expect(() => writePopupState(null, { subscribed: true })).not.toThrow();
  });
});

describe("isSuppressed", () => {
  it("does not suppress a first-time visitor", () => {
    expect(isSuppressed(null, NOW)).toBe(false);
  });

  it("always suppresses after a popup signup", () => {
    expect(isSuppressed({ subscribed: true }, NOW + 365 * DAY)).toBe(true);
  });

  it("suppresses for 30 days after a dismissal", () => {
    expect(DISMISS_SUPPRESS_MS).toBe(30 * DAY);
    expect(isSuppressed({ dismissedAt: NOW }, NOW + 29 * DAY)).toBe(true);
    expect(isSuppressed({ dismissedAt: NOW }, NOW + 30 * DAY)).toBe(false);
  });

  it("does not suppress when the dismissal is dated in the future", () => {
    expect(isSuppressed({ dismissedAt: NOW + 400 * DAY }, NOW)).toBe(false);
  });
});

describe("hasReachedScrollTrigger", () => {
  // 3000px page, 1000px viewport => 2000px scrollable; 35% = 700px
  it("fires at 35% of the scrollable distance", () => {
    expect(hasReachedScrollTrigger(699, 1000, 3000)).toBe(false);
    expect(hasReachedScrollTrigger(700, 1000, 3000)).toBe(true);
  });

  it("never fires on a page that cannot scroll (the timer covers it)", () => {
    expect(hasReachedScrollTrigger(0, 1000, 1000)).toBe(false);
    expect(hasReachedScrollTrigger(0, 1000, 800)).toBe(false);
  });
});

describe("parseEmbedMessage", () => {
  it("accepts a resize from the embed", () => {
    expect(parseEmbedMessage({ source: EMBED_MESSAGE_SOURCE, type: "resize", height: 240.4 })).toEqual({
      type: "resize",
      height: 241,
    });
  });

  it("clamps absurd heights", () => {
    expect(parseEmbedMessage({ source: EMBED_MESSAGE_SOURCE, type: "resize", height: 99999 })).toEqual({
      type: "resize",
      height: MAX_EMBED_HEIGHT,
    });
  });

  it("accepts a success from the embed", () => {
    expect(parseEmbedMessage({ source: EMBED_MESSAGE_SOURCE, type: "success" })).toEqual({ type: "success" });
  });

  it.each([
    null,
    "success",
    { type: "success" },
    { source: "pal-chat", type: "success" },
    { source: EMBED_MESSAGE_SOURCE, type: "resize", height: "240" },
    { source: EMBED_MESSAGE_SOURCE, type: "resize", height: -5 },
    { source: EMBED_MESSAGE_SOURCE, type: "resize", height: Number.NaN },
    { source: EMBED_MESSAGE_SOURCE, type: "redirect", url: "https://evil.example" },
  ])("ignores %j", (data) => {
    expect(parseEmbedMessage(data)).toBeNull();
  });

  it("round-trips what the embed sends", () => {
    expect(parseEmbedMessage(toEmbedPayload({ type: "success" }))).toEqual({ type: "success" });
  });
});
