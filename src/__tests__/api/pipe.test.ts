import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { snapshot } from "./helpers";

vi.mock("@sentry/astro", () => ({ flush: vi.fn().mockResolvedValue(true) }));
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { reportError } = await import("../../lib/report-error");
const { POST } = await import("../../pages/api/pipe");

const LOCALS = { runtime: { ctx: { waitUntil: vi.fn() }, env: {} } } as unknown as App.Locals;

function call(origin: string | null, body = '{"n":"pageview"}') {
  const headers: Record<string, string> = { "content-type": "text/plain", "user-agent": "ua" };
  if (origin) headers.origin = origin;
  const request = new Request("https://techforpalestine.org/api/pipe", {
    method: "POST",
    headers,
    body,
  });
  return POST({ request, locals: LOCALS } as never);
}

describe("POST /api/pipe", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("ok", { status: 202, headers: { "content-type": "text/plain" } })
        )
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("403 plain text for a foreign origin, without touching Plausible", async () => {
    const res = await snapshot(await call("https://evil.example"));
    expect(res.status).toBe(403);
    expect(res.text).toBe("Forbidden");
    expect(res.headers["content-type"]).toMatch(/^text\/plain/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects pages.dev look-alikes", async () => {
    expect((await call("https://evilpages.dev")).status).toBe(403);
    expect((await call("https://pages.dev")).status).toBe(403);
  });

  it("accepts a request with no Origin header", async () => {
    const res = await snapshot(await call(null));
    expect(res).toMatchObject({ status: 202, text: "ok" });
  });

  it("accepts a *.pages.dev origin and forwards to Plausible", async () => {
    const res = await snapshot(await call("https://abc.website.pages.dev"));
    expect(res.status).toBe(202);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://plausible.io/api/event");
    expect((init as RequestInit).body).toBe('{"n":"pageview"}');
  });

  it("mirrors the dropped flag from Plausible and reports it", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("", { status: 202, headers: { "x-plausible-dropped": "1" } })
    );
    const res = await snapshot(await call(null));
    expect(res.status).toBe(202);
    expect(res.headers["x-plausible-dropped"]).toBe("1");
    expect(reportError).toHaveBeenCalled();
  });

  it("502 with an empty body when the upstream fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));
    const res = await snapshot(await call(null));
    expect(res).toMatchObject({ status: 502, text: "" });
  });
});
