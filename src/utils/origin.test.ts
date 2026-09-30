import { describe, expect, it } from "vitest";
import { ALLOWED_ORIGIN, corsHeaders, isAllowedOrigin } from "./origin";

describe("isAllowedOrigin", () => {
  it("accepts the production origin by default", () => {
    expect(isAllowedOrigin(ALLOWED_ORIGIN)).toBe(true);
  });

  it("rejects a missing origin by default", () => {
    expect(isAllowedOrigin(null)).toBe(false);
  });

  it("accepts a missing origin only when the policy allows it", () => {
    expect(isAllowedOrigin(null, { allowMissingOrigin: true })).toBe(true);
  });

  it("rejects a foreign origin", () => {
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
  });

  it("rejects look-alike origins that merely contain the allowed host", () => {
    expect(isAllowedOrigin("https://techforpalestine.org.evil.example")).toBe(false);
    expect(isAllowedOrigin("http://techforpalestine.org")).toBe(false);
  });

  it("honours an explicit allowlist instead of the default", () => {
    const policy = { allowedOrigins: ["https://staging.example"] };
    expect(isAllowedOrigin("https://staging.example", policy)).toBe(true);
    expect(isAllowedOrigin(ALLOWED_ORIGIN, policy)).toBe(false);
  });

  it("matches allowed hostname suffixes", () => {
    const policy = { allowedSuffixes: [".pages.dev"] };
    expect(isAllowedOrigin("https://abc123.website.pages.dev", policy)).toBe(true);
    expect(isAllowedOrigin("https://pages.dev.evil.example", policy)).toBe(false);
  });

  it("returns false for a malformed origin when checking suffixes", () => {
    expect(isAllowedOrigin("not a url", { allowedSuffixes: [".pages.dev"] })).toBe(false);
  });
});

describe("corsHeaders", () => {
  it("echoes the given origin, never a wildcard", () => {
    expect(corsHeaders(ALLOWED_ORIGIN)["Access-Control-Allow-Origin"]).toBe(ALLOWED_ORIGIN);
  });

  it("defaults to POST and OPTIONS", () => {
    expect(corsHeaders(ALLOWED_ORIGIN)["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
  });
});
