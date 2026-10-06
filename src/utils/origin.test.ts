import { describe, expect, it, vi } from "vitest";
import {
  ALLOWED_ORIGIN,
  PAYMENT_ORIGIN_POLICY,
  corsHeaders,
  isAllowedOrigin,
  makeOptionsHandler,
  withOriginGuard,
} from "./origin";

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

  it("matches suffixes on a label boundary", () => {
    const policy = { allowedSuffixes: [".pages.dev"] };
    expect(isAllowedOrigin("https://evilpages.dev", policy)).toBe(false);
    expect(isAllowedOrigin("https://pages.dev", policy)).toBe(false);
  });

  it("treats a suffix without a leading dot as if it had one", () => {
    const policy = { allowedSuffixes: ["pages.dev"] };
    expect(isAllowedOrigin("https://abc.pages.dev", policy)).toBe(true);
    expect(isAllowedOrigin("https://evilpages.dev", policy)).toBe(false);
    expect(isAllowedOrigin("https://pages.dev", policy)).toBe(false);
  });

  it("keeps the deployed suffixes working", () => {
    const payment = { allowedSuffixes: [".website-aun.pages.dev"] };
    expect(isAllowedOrigin("https://abc.website-aun.pages.dev", payment)).toBe(true);
    expect(isAllowedOrigin("https://website-aun.pages.dev", payment)).toBe(false);
    expect(isAllowedOrigin("https://evil.pages.dev", payment)).toBe(false);
  });
});

describe("PAYMENT_ORIGIN_POLICY", () => {
  it("accepts the production origin and preview deployments only", () => {
    expect(isAllowedOrigin(ALLOWED_ORIGIN, PAYMENT_ORIGIN_POLICY)).toBe(true);
    expect(isAllowedOrigin("https://pr-1.website-aun.pages.dev", PAYMENT_ORIGIN_POLICY)).toBe(true);
    expect(isAllowedOrigin("https://evil.example", PAYMENT_ORIGIN_POLICY)).toBe(false);
    expect(isAllowedOrigin(null, PAYMENT_ORIGIN_POLICY)).toBe(false);
  });
});

describe("withOriginGuard", () => {
  const run = (origin: string | null, options?: Parameters<typeof withOriginGuard>[2]) => {
    const handler = vi.fn(async () => new Response("ok"));
    const guarded = withOriginGuard({}, handler, options);
    const headers = origin ? { Origin: origin } : undefined;
    const request = new Request("https://techforpalestine.org/api/x", { method: "POST", headers });
    return { handler, result: guarded({ request }) };
  };

  it("runs the handler with the origin for an allowed origin", async () => {
    const { handler, result } = run(ALLOWED_ORIGIN);
    expect((await result).status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.anything(), ALLOWED_ORIGIN);
  });

  it("answers 403 JSON without CORS headers and skips the handler", async () => {
    const { handler, result } = run("https://evil.example");
    const res = await result;
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect([...res.headers.keys()]).toEqual(["content-type"]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a missing origin by default", async () => {
    expect((await run(null).result).status).toBe(403);
  });

  it("uses a custom forbidden response", async () => {
    const { result } = run("https://evil.example", {
      forbidden: () => new Response("Forbidden", { status: 403 }),
    });
    expect(await (await result).text()).toBe("Forbidden");
  });

  it("never reads the body for a rejected origin", async () => {
    const request = new Request("https://techforpalestine.org/api/x", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
      body: "{}",
    });
    await withOriginGuard({}, async () => new Response("ok"))({ request });
    expect(request.bodyUsed).toBe(false);
  });
});

describe("makeOptionsHandler", () => {
  const options = makeOptionsHandler({});
  const preflight = (origin?: string) =>
    options({
      request: new Request("https://techforpalestine.org/api/x", {
        method: "OPTIONS",
        headers: origin ? { Origin: origin } : undefined,
      }),
    });

  it("answers 200 with CORS headers for an allowed origin", async () => {
    const res = await preflight(ALLOWED_ORIGIN);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    expect(res.headers.get("access-control-allow-methods")).toBe("POST, OPTIONS");
  });

  it("answers an empty 403 otherwise", async () => {
    const res = await preflight("https://evil.example");
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("");
    expect(await preflight()).toHaveProperty("status", 403);
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
