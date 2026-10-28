import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureApiResponse } from "@growthbook/growthbook";
import { evalServerFeature, loadFeaturePayload, resetPayloadCache } from "./growthbookServer";

const payload: FeatureApiResponse = {
  features: {
    "homepage-description": {
      defaultValue: "A",
      rules: [{ force: "B", coverage: 0.5, hashAttribute: "id" }, { force: "A" }],
    },
  },
};

function okFetch(body: unknown = payload) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
}

describe("loadFeaturePayload", () => {
  beforeEach(() => resetPayloadCache());

  it("fetches the payload for the client key from the GrowthBook CDN", async () => {
    const fetchImpl = okFetch();
    const result = await loadFeaturePayload("sdk-key", { fetchImpl });
    expect(result).toEqual(payload);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://cdn.growthbook.io/api/features/sdk-key",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("serves a fresh payload from memory without refetching", async () => {
    const fetchImpl = okFetch();
    let time = 0;
    const now = () => time;
    await loadFeaturePayload("sdk-key", { fetchImpl, now });
    time = 59_000;
    await loadFeaturePayload("sdk-key", { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cached payload is a minute old", async () => {
    const fetchImpl = okFetch();
    let time = 0;
    const now = () => time;
    await loadFeaturePayload("sdk-key", { fetchImpl, now });
    time = 60_000;
    await loadFeaturePayload("sdk-key", { fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("falls back to the stale payload when a refetch fails", async () => {
    let time = 0;
    const now = () => time;
    await loadFeaturePayload("sdk-key", { fetchImpl: okFetch(), now });
    time = 120_000;
    const failing = vi.fn(async () => new Response("", { status: 503 }));
    expect(await loadFeaturePayload("sdk-key", { fetchImpl: failing, now })).toEqual(payload);
  });

  it("returns undefined when the fetch fails and nothing is cached", async () => {
    const failing = vi.fn(async () => {
      throw new Error("network down");
    });
    expect(await loadFeaturePayload("sdk-key", { fetchImpl: failing })).toBeUndefined();
  });

  it("does not reuse a payload cached for a different client key", async () => {
    const fetchImpl = okFetch();
    await loadFeaturePayload("key-one", { fetchImpl });
    await loadFeaturePayload("key-two", { fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("evalServerFeature", () => {
  it("buckets the same id into the same value every time", () => {
    const first = evalServerFeature(payload, "homepage-description", "visitor-1");
    const second = evalServerFeature(payload, "homepage-description", "visitor-1");
    expect(first.value).toBe(second.value);
    expect(first.source).toBe("force");
  });

  it("splits ids across both values", () => {
    const values = new Set(
      Array.from(
        { length: 200 },
        (_, i) => evalServerFeature(payload, "homepage-description", `visitor-${i}`).value
      )
    );
    expect(values).toEqual(new Set(["A", "B"]));
  });

  it("reports an unknown feature when the flag is missing", () => {
    const result = evalServerFeature({ features: {} }, "homepage-description", "visitor-1");
    expect(result.source).toBe("unknownFeature");
  });
});
