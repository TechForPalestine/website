import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Ctx = { url: URL; request: Request; locals: Record<string, unknown> };
type Mw = (ctx: Ctx, next: () => Promise<Response>) => Promise<Response>;

// Minimal stand-in for astro:middleware: identity defineMiddleware and a
// sequence() that composes left to right like Astro's.
vi.mock("astro:middleware", () => ({
  defineMiddleware: (fn: Mw) => fn,
  sequence:
    (...fns: Mw[]) =>
    (ctx: Ctx, next: () => Promise<Response>) => {
      const run = (i: number): Promise<Response> =>
        i === fns.length ? next() : fns[i](ctx, () => run(i + 1));
      return run(0);
    },
}));
vi.mock("./sentry-init.js", () => ({
  sentryInit: (_ctx: Ctx, next: () => Promise<Response>) => next(),
}));

async function run(path: string, method = "GET", contentType = "text/html") {
  const { onRequest } = await import("./index");
  const url = new URL(`https://techforpalestine.org${path}`);
  const ctx: Ctx = { url, request: new Request(url, { method }), locals: {} };
  const res = await (onRequest as unknown as Mw)(
    ctx,
    async () => new Response("<p>hi</p>", { headers: { "Content-Type": contentType } })
  );
  return { res, ctx };
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("middleware chain", () => {
  it("sets security headers on every response", async () => {
    const { res } = await run("/");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it.each(["/api/events", "/admin", "/admin/conversions"])("forces no-store on %s", async (p) => {
    const { res } = await run(p);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("forces no-store on non-GET requests", async () => {
    const { res } = await run("/about", "POST");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("caches ordinary GET pages", async () => {
    const { res } = await run("/about");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=600");
  });

  it("sets no CSP when HTMLRewriter is undefined (dev/Node)", async () => {
    const { res, ctx } = await run("/");
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    expect(typeof ctx.locals.cspNonce).toBe("string");
  });

  it("sets CSP and keeps earlier headers when HTMLRewriter exists", async () => {
    class FakeRewriter {
      on() {
        return this;
      }
      transform(r: Response) {
        return new Response(r.body, { headers: new Headers(r.headers) });
      }
    }
    vi.stubGlobal("HTMLRewriter", FakeRewriter);
    const { res } = await run("/");
    expect(res.headers.get("Content-Security-Policy")).toContain("script-src 'nonce-");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    // cacheControl and securityHeaders ran before csp replaced the response
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=600");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("skips CSP for non-HTML responses", async () => {
    vi.stubGlobal("HTMLRewriter", class {});
    const { res } = await run("/api/x", "GET", "application/json");
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
  });
});
