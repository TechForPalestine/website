import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./growthbookServer", () => ({
  loadFeaturePayload: vi.fn(),
  evalServerFeature: vi.fn(),
}));

const { loadFeaturePayload, evalServerFeature } = await import("./growthbookServer");
const {
  assignNavLabelVariant,
  computeAssignmentId,
  normalizeIp,
  requestAssignmentId,
  resetAssignmentWarning,
} = await import("./navAssignment");

const base = {
  secret: "test-secret",
  ip: "203.0.113.7",
  userAgent: "Mozilla/5.0 Test",
  date: new Date("2026-11-10T09:00:00Z"),
};

describe("normalizeIp", () => {
  it("keeps IPv4 as is", () => {
    expect(normalizeIp("203.0.113.7")).toBe("203.0.113.7");
  });

  it("keeps only the /64 prefix of IPv6, expanding ::", () => {
    expect(normalizeIp("2001:db8:abcd:12::1")).toBe("2001:db8:abcd:12");
    expect(normalizeIp("2001:DB8:ABCD:0012:aaaa:bbbb:cccc:dddd")).toBe("2001:db8:abcd:12");
    expect(normalizeIp("2001:db8::1")).toBe("2001:db8:0:0");
  });

  it("treats IPv4-mapped IPv6 as the IPv4 address", () => {
    expect(normalizeIp("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });
});

describe("computeAssignmentId", () => {
  it("is stable for the same visitor on the same day", async () => {
    const later = { ...base, date: new Date("2026-11-10T22:59:00Z") };
    expect(await computeAssignmentId(base)).toBe(await computeAssignmentId(later));
  });

  it("rotates at the UTC day boundary", async () => {
    const nextDay = { ...base, date: new Date("2026-11-11T00:01:00Z") };
    expect(await computeAssignmentId(base)).not.toBe(await computeAssignmentId(nextDay));
  });

  it("differs by IP, User-Agent and secret", async () => {
    const id = await computeAssignmentId(base);
    expect(await computeAssignmentId({ ...base, ip: "203.0.113.8" })).not.toBe(id);
    expect(await computeAssignmentId({ ...base, userAgent: "Other" })).not.toBe(id);
    expect(await computeAssignmentId({ ...base, secret: "other" })).not.toBe(id);
  });

  it("treats IPv6 addresses in the same /64 as one visitor", async () => {
    const a = await computeAssignmentId({ ...base, ip: "2001:db8:abcd:12::1" });
    const b = await computeAssignmentId({ ...base, ip: "2001:db8:abcd:12:ffff::9" });
    expect(a).toBe(b);
  });

  it("is an opaque 64-char hex digest, so the IP and User-Agent cannot appear in it", async () => {
    expect(await computeAssignmentId(base)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("requestAssignmentId", () => {
  beforeEach(() => resetAssignmentWarning());
  afterEach(() => vi.restoreAllMocks());

  const locals = { runtime: { env: { NAV_ASSIGNMENT_SECRET: "test-secret" } } };
  const req = (headers: Record<string, string>) =>
    new Request("https://techforpalestine.org/", { headers });
  const now = () => base.date;

  it("uses the keyed hash when the secret and IP are present", async () => {
    const headers = { "cf-connecting-ip": base.ip, "user-agent": base.userAgent };
    expect(await requestAssignmentId(req(headers), locals, now)).toEqual({
      id: await computeAssignmentId(base),
      stable: true,
    });
  });

  it("falls back to a per-request id without an IP (pnpm dev)", async () => {
    const a = await requestAssignmentId(req({}), locals, now);
    const b = await requestAssignmentId(req({}), locals, now);
    expect(a.stable).toBe(false);
    expect(a.id).not.toBe(b.id);
  });

  it("falls back to a per-request id and warns once without the secret", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const headers = { "cf-connecting-ip": base.ip };
    const a = await requestAssignmentId(req(headers), {}, now);
    const b = await requestAssignmentId(req(headers), {}, now);
    expect(a.stable).toBe(false);
    expect(a.id).not.toBe(b.id);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe("assignNavLabelVariant", () => {
  const env = { NAV_ASSIGNMENT_SECRET: "test-secret", PUBLIC_GROWTHBOOK_CLIENT_KEY: "sdk-test" };
  const locals = { runtime: { env } };
  const headers = { "cf-connecting-ip": base.ip, "user-agent": base.userAgent };
  const req = (h: Record<string, string>) =>
    new Request("https://techforpalestine.org/", { headers: h });
  const now = () => base.date;

  beforeEach(() => {
    vi.mocked(loadFeaturePayload).mockResolvedValue({ features: {} });
    vi.mocked(evalServerFeature).mockReturnValue({ value: "B", source: "force" } as never);
  });
  afterEach(() => vi.clearAllMocks());

  it("gives a page view and a later API call from the same visitor the same id", async () => {
    await assignNavLabelVariant(req(headers), locals, { now });
    await assignNavLabelVariant(
      new Request("https://techforpalestine.org/api/membership-complete", {
        method: "POST",
        headers,
      }),
      locals,
      { requireStable: true, now }
    );
    const [first, second] = vi.mocked(evalServerFeature).mock.calls;
    expect(first[2]).toBe(await computeAssignmentId(base));
    expect(second[2]).toBe(first[2]);
  });

  it("returns the variant GrowthBook assigned", async () => {
    expect(await assignNavLabelVariant(req(headers), locals, { now })).toBe("B");
  });

  it("returns null with requireStable when the id is a throwaway", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const noSecret = { runtime: { env: { PUBLIC_GROWTHBOOK_CLIENT_KEY: "sdk-test" } } };
    expect(
      await assignNavLabelVariant(req(headers), noSecret, { requireStable: true, now })
    ).toBeNull();
    expect(await assignNavLabelVariant(req(headers), noSecret, { now })).toBe("B");
  });

  it("returns null when the GrowthBook payload is unavailable", async () => {
    vi.mocked(loadFeaturePayload).mockResolvedValue(undefined);
    expect(await assignNavLabelVariant(req(headers), locals, { now })).toBeNull();
  });
});
