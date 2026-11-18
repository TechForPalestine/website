import { describe, expect, it } from "vitest";
import {
  EMPTY_OVERRIDES,
  isGroupOpen,
  settleOverrides,
  toggleGroup,
  type GroupOverrides,
} from "./outlineGroups";

const active = (...ids: string[]): ReadonlySet<string> => new Set(ids);

describe("isGroupOpen", () => {
  it("opens the group being read and closes the rest", () => {
    expect(isGroupOpen("a", active("a"), EMPTY_OVERRIDES)).toBe(true);
    expect(isGroupOpen("b", active("a"), EMPTY_OVERRIDES)).toBe(false);
  });

  it("closes every group when nothing is being read", () => {
    expect(isGroupOpen("a", active(), EMPTY_OVERRIDES)).toBe(false);
  });

  it("lets a reader's choice win over the reading position", () => {
    const overrides: GroupOverrides = new Map([
      ["a", "closed"],
      ["b", "open"],
    ]);
    expect(isGroupOpen("a", active("a"), overrides)).toBe(false);
    expect(isGroupOpen("b", active("a"), overrides)).toBe(true);
  });
});

describe("toggleGroup", () => {
  it("opens a closed group by hand", () => {
    const next = toggleGroup(EMPTY_OVERRIDES, "b", active("a"));
    expect(isGroupOpen("b", active("a"), next)).toBe(true);
  });

  it("closes the group being read by hand", () => {
    const next = toggleGroup(EMPTY_OVERRIDES, "a", active("a"));
    expect(isGroupOpen("a", active("a"), next)).toBe(false);
  });

  it("closes a hand-opened group again", () => {
    const opened = toggleGroup(EMPTY_OVERRIDES, "b", active("a"));
    const closed = toggleGroup(opened, "b", active("a"));
    expect(isGroupOpen("b", active("a"), closed)).toBe(false);
  });

  it("does not mutate the overrides it is given", () => {
    const before: GroupOverrides = new Map();
    toggleGroup(before, "b", active());
    expect(before.size).toBe(0);
  });
});

describe("settleOverrides", () => {
  it("keeps a hand-opened group open after the reader scrolls away", () => {
    const opened = toggleGroup(EMPTY_OVERRIDES, "b", active("a"));
    const settled = settleOverrides(opened, active("c"));
    expect(isGroupOpen("b", active("c"), settled)).toBe(true);
  });

  it("keeps a hand-closed group closed while it is still being read", () => {
    const closed = toggleGroup(EMPTY_OVERRIDES, "a", active("a"));
    const settled = settleOverrides(closed, active("a"));
    expect(isGroupOpen("a", active("a"), settled)).toBe(false);
  });

  it("forgets a hand-close once the reader leaves that group, so it opens again on return", () => {
    const closed = toggleGroup(EMPTY_OVERRIDES, "a", active("a"));
    const left = settleOverrides(closed, active("b"));
    expect(left.has("a")).toBe(false);
    expect(isGroupOpen("a", active("a"), settleOverrides(left, active("a")))).toBe(true);
  });

  it("returns the same map when nothing changes", () => {
    const opened = toggleGroup(EMPTY_OVERRIDES, "b", active("a"));
    expect(settleOverrides(opened, active("c"))).toBe(opened);
  });

  it("handles nested groups: every ancestor of the current heading is active", () => {
    const overrides = toggleGroup(EMPTY_OVERRIDES, "entry", active("entry", "heading"));
    const settled = settleOverrides(overrides, active("entry", "heading"));
    expect(isGroupOpen("entry", active("entry", "heading"), settled)).toBe(false);
    expect(isGroupOpen("heading", active("entry", "heading"), settled)).toBe(true);
  });
});
