import { describe, expect, it } from "vitest";
import { constantTimeEqual, verifyHmacSha256Hex } from "./crypto";

describe("constantTimeEqual", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEqual("s3cret", "s3cret")).toBe(true);
  });

  it("returns false for same-length strings that differ", () => {
    expect(constantTimeEqual("s3cret", "s3creT")).toBe(false);
  });

  it("returns false for different lengths without throwing", () => {
    expect(constantTimeEqual("short", "muchlonger")).toBe(false);
  });

  it("returns false when only one side is empty", () => {
    expect(constantTimeEqual("", "x")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(constantTimeEqual("", "")).toBe(true);
  });

  it("compares multi-byte characters by bytes, not length", () => {
    expect(constantTimeEqual("é", "é")).toBe(true);
  });

  it("returns false, not throws, when .length matches but UTF-8 byte length differs", () => {
    // "é" is 2 bytes, "e" is 1 byte, but "éa".length === "ee".length === 2
    expect(constantTimeEqual("é", "e")).toBe(false);
    expect(constantTimeEqual("éa", "eee")).toBe(false);
    expect(constantTimeEqual("é", "ee")).toBe(false);
  });
});

describe("verifyHmacSha256Hex", () => {
  // HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog")
  const KNOWN = "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8";
  const BODY = "The quick brown fox jumps over the lazy dog";

  it("accepts a valid signature", async () => {
    expect(await verifyHmacSha256Hex("key", BODY, KNOWN)).toBe(true);
  });

  it("rejects a wrong signature of the right length", async () => {
    expect(await verifyHmacSha256Hex("key", BODY, "0".repeat(64))).toBe(false);
  });

  it("rejects a wrong-length signature without throwing", async () => {
    expect(await verifyHmacSha256Hex("key", BODY, "abcd")).toBe(false);
  });

  it("rejects a valid signature made with a different secret", async () => {
    expect(await verifyHmacSha256Hex("other", BODY, KNOWN)).toBe(false);
  });
});
