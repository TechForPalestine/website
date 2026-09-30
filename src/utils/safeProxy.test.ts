import { describe, expect, it } from "vitest";
import { buildForwardHeaders, normalizeProxyPath } from "./safeProxy";

const PREFIX = "/api/method/";

describe("normalizeProxyPath", () => {
  it("accepts a path under the prefix", () => {
    expect(normalizeProxyPath("/api/method/foo", PREFIX)).toBe("/api/method/foo");
  });
  it("rejects missing or empty paths", () => {
    expect(normalizeProxyPath(null, PREFIX)).toBeNull();
    expect(normalizeProxyPath("", PREFIX)).toBeNull();
  });
  it("rejects a wrong prefix", () => {
    expect(normalizeProxyPath("/api/auth/admin", PREFIX)).toBeNull();
  });
  it("rejects dot-segment traversal", () => {
    expect(normalizeProxyPath("/api/method/../../api/auth/admin", PREFIX)).toBeNull();
  });
  it("rejects encoded traversal (%2e%2e)", () => {
    expect(normalizeProxyPath("/api/method/%2e%2e/%2e%2e/api/auth", PREFIX)).toBeNull();
  });
  it("rejects backslash traversal", () => {
    expect(normalizeProxyPath("/api/method/..\\..\\admin", PREFIX)).toBeNull();
  });
  it("discards the host of a protocol-relative // path (only the pathname is ever forwarded)", () => {
    expect(normalizeProxyPath("//evil.example/api/method/x", PREFIX)).toBe("/api/method/x");
    expect(normalizeProxyPath("//evil.example/admin", PREFIX)).toBeNull();
  });
  it("strips the query string from the normalized path", () => {
    expect(normalizeProxyPath("/api/method/foo?x=1", PREFIX)).toBe("/api/method/foo");
  });
});

describe("buildForwardHeaders", () => {
  it("forwards only allowlisted headers and sets Authorization", () => {
    const incoming = new Headers({
      "content-type": "application/json",
      accept: "*/*",
      cookie: "session=1",
      "x-forwarded-for": "1.2.3.4",
      authorization: "Bearer attacker",
    });
    const out = buildForwardHeaders(incoming, "secret");
    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("accept")).toBe("*/*");
    expect(out.get("cookie")).toBeNull();
    expect(out.get("x-forwarded-for")).toBeNull();
    expect(out.get("authorization")).toBe("secret");
  });
});
