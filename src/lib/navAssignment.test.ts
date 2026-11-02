import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAssignmentId, normalizeIp, requestAssignmentId } from "./navAssignment";

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

  it("does not contain the IP or User-Agent", async () => {
    const id = await computeAssignmentId(base);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("requestAssignmentId", () => {
  afterEach(() => vi.restoreAllMocks());

  const locals = { runtime: { env: { NAV_ASSIGNMENT_SECRET: "test-secret" } } };
  const req = (headers: Record<string, string>) =>
    new Request("https://techforpalestine.org/", { headers });
  const now = () => base.date;

  it("uses the keyed hash when the secret and IP are present", async () => {
    const headers = { "cf-connecting-ip": base.ip, "user-agent": base.userAgent };
    expect(await requestAssignmentId(req(headers), locals, now)).toBe(
      await computeAssignmentId(base)
    );
  });

  it("falls back to a per-request id without an IP (pnpm dev)", async () => {
    const a = await requestAssignmentId(req({}), locals, now);
    const b = await requestAssignmentId(req({}), locals, now);
    expect(a).not.toBe(b);
  });

  it("falls back to a per-request id and warns once without the secret", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const headers = { "cf-connecting-ip": base.ip };
    const a = await requestAssignmentId(req(headers), {}, now);
    const b = await requestAssignmentId(req(headers), {}, now);
    expect(a).not.toBe(b);
    expect(warn).toHaveBeenCalledOnce();
  });
});
