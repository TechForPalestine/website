import { describe, expect, it } from "vitest";
import { CTA_TEXT, pickCtaVariant } from "./ctaExperiment";

describe("pickCtaVariant", () => {
  it("returns control for the lower half of the range", () => {
    expect(pickCtaVariant(() => 0)).toBe("control");
    expect(pickCtaVariant(() => 0.499)).toBe("control");
  });

  it("returns treatment for the upper half of the range", () => {
    expect(pickCtaVariant(() => 0.5)).toBe("treatment");
    expect(pickCtaVariant(() => 0.999)).toBe("treatment");
  });

  it("has distinct text per variant", () => {
    expect(CTA_TEXT.control).not.toBe(CTA_TEXT.treatment);
  });
});
