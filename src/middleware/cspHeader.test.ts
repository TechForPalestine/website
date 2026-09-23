import { describe, expect, it } from "vitest";
import { buildCspHeader, frameOptionsFor, isEmbeddablePath } from "./cspHeader";

function directive(header: string, name: string): string | undefined {
  return header
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `));
}

describe("isEmbeddablePath", () => {
  it.each(["/newsletter-embed", "/newsletter-embed/"])("allows %s", (p) => {
    expect(isEmbeddablePath(p)).toBe(true);
  });

  it.each(["/", "/donate", "/newsletter-embed/x", "/newsletter-embedded", "/api/newsletter-embed"])(
    "refuses %s",
    (p) => {
      expect(isEmbeddablePath(p)).toBe(false);
    }
  );
});

describe("buildCspHeader", () => {
  it("lets only our own origin frame the newsletter embed", () => {
    expect(directive(buildCspHeader("n", "/newsletter-embed"), "frame-ancestors")).toBe("frame-ancestors 'self'");
  });

  it("forbids framing every other page", () => {
    expect(directive(buildCspHeader("n", "/"), "frame-ancestors")).toBe("frame-ancestors 'none'");
  });

  it("allows same-origin iframes so the homepage can load the embed", () => {
    expect(directive(buildCspHeader("n", "/"), "frame-src")).toMatch(/^frame-src 'self' /);
  });

  it("keeps the per-request nonce and never allows unsafe-inline", () => {
    const header = buildCspHeader("abc123", "/");
    expect(directive(header, "script-src")).toContain("'nonce-abc123'");
    expect(directive(header, "style-src")).toContain("'nonce-abc123'");
    expect(header).not.toContain("unsafe-inline");
  });
});

describe("frameOptionsFor", () => {
  it("mirrors frame-ancestors for older browsers", () => {
    expect(frameOptionsFor("/newsletter-embed")).toBe("SAMEORIGIN");
    expect(frameOptionsFor("/")).toBe("DENY");
  });
});
