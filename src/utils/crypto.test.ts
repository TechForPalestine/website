import { describe, expect, it } from "vitest";
import { constantTimeEqual } from "./crypto";

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
