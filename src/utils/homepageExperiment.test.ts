import { describe, expect, it } from "vitest";
import { pickHomepageVariant } from "./homepageExperiment";

describe("pickHomepageVariant", () => {
  it("returns control for the lower half of the range", () => {
    expect(pickHomepageVariant(() => 0)).toBe("control");
    expect(pickHomepageVariant(() => 0.499)).toBe("control");
  });

  it("returns treatment for the upper half of the range", () => {
    expect(pickHomepageVariant(() => 0.5)).toBe("treatment");
    expect(pickHomepageVariant(() => 0.999)).toBe("treatment");
  });
});
