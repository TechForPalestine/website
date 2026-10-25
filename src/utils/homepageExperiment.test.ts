import { describe, expect, it } from "vitest";
import { pickHomepageVariant } from "./homepageExperiment";

describe("pickHomepageVariant", () => {
  it("returns A for the lower half of the range", () => {
    expect(pickHomepageVariant(() => 0)).toBe("A");
    expect(pickHomepageVariant(() => 0.499)).toBe("A");
  });

  it("returns B for the upper half of the range", () => {
    expect(pickHomepageVariant(() => 0.5)).toBe("B");
    expect(pickHomepageVariant(() => 0.999)).toBe("B");
  });
});
