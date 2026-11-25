import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./growthbookServer", () => ({
  loadFeaturePayload: vi.fn(),
  evalServerFeature: vi.fn(),
}));
vi.mock("./visitorAssignment", () => ({
  requestAssignmentId: vi.fn(),
}));

const { loadFeaturePayload, evalServerFeature } = await import("./growthbookServer");
const { requestAssignmentId } = await import("./visitorAssignment");
const { assignHeroPhoto } = await import("./heroPhotoAssignment");

describe("assignHeroPhoto", () => {
  const locals = { runtime: { env: { PUBLIC_GROWTHBOOK_CLIENT_KEY: "sdk-test" } } };
  const req = () => new Request("https://techforpalestine.org/");

  beforeEach(() => {
    vi.mocked(loadFeaturePayload).mockResolvedValue({ features: {} });
    vi.mocked(requestAssignmentId).mockResolvedValue("visitor-id");
    vi.mocked(evalServerFeature).mockReturnValue({
      value: "laptops",
      source: "experiment",
    } as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("returns the variant GrowthBook assigned, evaluated on the assignment id", async () => {
    expect(await assignHeroPhoto(req(), locals)).toBe("laptops");
    expect(vi.mocked(evalServerFeature).mock.calls[0].slice(1)).toEqual([
      "homepage-hero-photo",
      "visitor-id",
    ]);
  });

  it("returns null when the result is not from the experiment", async () => {
    vi.mocked(evalServerFeature).mockReturnValue({ value: "laptops", source: "force" } as never);
    expect(await assignHeroPhoto(req(), locals)).toBeNull();
  });

  it("returns null without a client key", async () => {
    expect(await assignHeroPhoto(req(), {})).toBeNull();
    expect(evalServerFeature).not.toHaveBeenCalled();
  });

  it("returns null when the payload is unavailable", async () => {
    vi.mocked(loadFeaturePayload).mockResolvedValue(undefined);
    expect(await assignHeroPhoto(req(), locals)).toBeNull();
  });

  it("returns null without an assignment id", async () => {
    vi.mocked(requestAssignmentId).mockResolvedValue(null);
    expect(await assignHeroPhoto(req(), locals)).toBeNull();
    expect(evalServerFeature).not.toHaveBeenCalled();
  });

  it("returns null and logs when evaluation throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(evalServerFeature).mockImplementation(() => {
      throw new Error("boom");
    });
    expect(await assignHeroPhoto(req(), locals)).toBeNull();
    expect(spy).toHaveBeenCalledWith("Hero photo assignment failed", expect.any(Error));
    spy.mockRestore();
  });
});
