import { describe, expect, it } from "vitest";
import { evalServerFeature } from "./growthbookServer";

// No mocks: runs the real GrowthBook SDK to check the experiment rule shape splits evenly.
describe("homepage-hero-photo split", () => {
  const payload = {
    features: {
      "homepage-hero-photo": {
        defaultValue: "control",
        rules: [
          {
            key: "homepage-hero-photo",
            variations: ["control", "speaker", "laptops", "stage"],
            weights: [0.25, 0.25, 0.25, 0.25],
            coverage: 1,
            hashAttribute: "id",
          },
        ],
      },
    },
  };

  it("buckets every visitor into the experiment, about a quarter per variant", () => {
    const total = 4000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < total; i++) {
      const result = evalServerFeature(payload, "homepage-hero-photo", crypto.randomUUID());
      expect(result.source).toBe("experiment");
      const value = String(result.value);
      counts[value] = (counts[value] ?? 0) + 1;
    }
    expect(Object.keys(counts).sort()).toEqual(["control", "laptops", "speaker", "stage"]);
    for (const count of Object.values(counts)) {
      expect(count / total).toBeGreaterThan(0.22);
      expect(count / total).toBeLessThan(0.28);
    }
  });
});
