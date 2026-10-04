import { describe, expect, it } from "vitest";
import { sanitizeUrl } from "./sanitizeUrl";

describe("sanitizeUrl", () => {
  it("passes http and https URLs through unchanged", () => {
    expect(sanitizeUrl("https://example.test/a?b=1")).toBe("https://example.test/a?b=1");
    expect(sanitizeUrl("http://example.test")).toBe("http://example.test");
  });

  it("allows relative paths", () => {
    expect(sanitizeUrl("/images/logo.png")).toBe("/images/logo.png");
  });

  it("rejects javascript:, data: and other schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("data:text/html,<b>x</b>")).toBe("");
    expect(sanitizeUrl("mailto:a@b.test")).toBe("");
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeUrl(undefined)).toBe("");
    expect(sanitizeUrl("")).toBe("");
  });
});
