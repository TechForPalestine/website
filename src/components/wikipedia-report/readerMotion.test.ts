import { describe, expect, it } from "vitest";
import { hasSettled, isLongJump, jumpDistance, needsLandingFix } from "./readerMotion";

describe("isLongJump", () => {
  it("glides for jumps within a couple of screens", () => {
    expect(isLongJump(1500, 800)).toBe(false);
    expect(isLongJump(-1500, 800)).toBe(false);
  });

  it("jumps instantly past the threshold, in either direction", () => {
    expect(isLongJump(2500, 800)).toBe(true);
    expect(isLongJump(-2500, 800)).toBe(true);
  });

  it("treats a zero-height viewport as a long jump (nothing to glide over)", () => {
    expect(isLongJump(10, 0)).toBe(true);
  });
});

describe("jumpDistance", () => {
  const VIEWPORT = 800;
  const targetAt = (top: number) => () => top;

  it("measures the target itself when there is no content-visibility section", () => {
    expect(jumpDistance(null, VIEWPORT, targetAt(420))).toBe(420);
  });

  it("measures the target when its section overlaps the viewport (it is rendered)", () => {
    // A long section that started above the screen: the target is close by.
    expect(jumpDistance({ top: -30000, bottom: 5000 }, VIEWPORT, targetAt(600))).toBe(600);
  });

  it("uses the section top when the section is off-screen, without measuring the target", () => {
    let measured = false;
    const distance = jumpDistance({ top: 9000, bottom: 15000 }, VIEWPORT, () => {
      measured = true;
      return 0;
    });
    expect(distance).toBe(9000);
    expect(measured).toBe(false);
  });

  it("treats a section that ends exactly at the viewport top as off-screen", () => {
    expect(jumpDistance({ top: -5000, bottom: 0 }, VIEWPORT, targetAt(1))).toBe(-5000);
  });
});

describe("needsLandingFix", () => {
  const VIEWPORT = 800;

  it("accepts a landing within tolerance of the scroll margin", () => {
    expect(
      needsLandingFix({ top: 105, scrollMargin: 104, atPageEnd: false, viewport: VIEWPORT })
    ).toBe(false);
  });

  it("corrects a small drift caused by sections rendering mid-glide", () => {
    expect(
      needsLandingFix({ top: 340, scrollMargin: 104, atPageEnd: false, viewport: VIEWPORT })
    ).toBe(true);
    expect(
      needsLandingFix({ top: -200, scrollMargin: 104, atPageEnd: false, viewport: VIEWPORT })
    ).toBe(true);
  });

  it("leaves large drifts alone: the reader has most likely scrolled away", () => {
    expect(
      needsLandingFix({ top: 104 + 900, scrollMargin: 104, atPageEnd: false, viewport: VIEWPORT })
    ).toBe(false);
    expect(
      needsLandingFix({ top: 104 - 900, scrollMargin: 104, atPageEnd: false, viewport: VIEWPORT })
    ).toBe(false);
  });

  it("leaves targets near the page end alone (the page cannot scroll further)", () => {
    expect(
      needsLandingFix({ top: 500, scrollMargin: 104, atPageEnd: true, viewport: VIEWPORT })
    ).toBe(false);
  });
});

describe("hasSettled", () => {
  it("waits for enough samples", () => {
    expect(hasSettled([100])).toBe(false);
    expect(hasSettled([100, 100])).toBe(false);
  });

  it("is settled once the last samples have not moved", () => {
    expect(hasSettled([0, 400, 900, 900, 900])).toBe(true);
  });

  it("is not settled while the page is still moving", () => {
    expect(hasSettled([0, 400, 900, 1300])).toBe(false);
    expect(hasSettled([900, 900, 901])).toBe(false);
  });
});
