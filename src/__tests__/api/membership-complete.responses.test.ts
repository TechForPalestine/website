import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSON_CORS_POST_OPTIONS, JSON_ONLY, ORIGIN, snapshot } from "./helpers";

vi.mock("../../utils/qgivVerify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/qgivVerify")>();
  return { ...actual, verifyQgivTransaction: vi.fn() };
});
vi.mock("@sentry/astro", () => ({ flush: vi.fn().mockResolvedValue(true) }));
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { verifyQgivTransaction } = await import("../../utils/qgivVerify");
const { reportError } = await import("../../lib/report-error");
const { POST, OPTIONS } = await import("../../pages/api/membership-complete");

const EO_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

const LOCALS = {
  runtime: {
    env: { HUB_API_URL: "https://hub.test", HUB_API_KEY: "hk", EO_API_KEY: "eo" },
    ctx: { waitUntil: vi.fn() },
  },
} as unknown as App.Locals;

function call(body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers.Origin = origin;
  const request = new Request("https://techforpalestine.org/api/membership-complete", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return POST({ request, locals: LOCALS } as never);
}

function member(overrides: Record<string, unknown> = {}) {
  return {
    ok: true as const,
    transaction: {
      id: "555001",
      formId: "1116610",
      email: "payer@example.org",
      firstName: "Ada",
      lastName: "Lovelace",
      amount: "25.00",
      optedIn: true,
      ...overrides,
    },
  };
}

describe("membership-complete responses", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("403 { message } with no CORS headers", async () => {
    const res = await snapshot(await call({ transactionId: "1" }, "https://evil.example"));
    expect(res).toMatchObject({ status: 403, headers: JSON_ONLY, json: { message: "Forbidden" } });
  });

  it("403 for a missing origin", async () => {
    expect((await call({ transactionId: "1" }, null)).status).toBe(403);
  });

  it("accepts the *.website-aun.pages.dev preview origin", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "invalid-id" });
    const res = await call({}, "https://abc.website-aun.pages.dev");
    expect(res.status).toBe(402);
  });

  it("rejects look-alikes of the preview suffix", async () => {
    expect((await call({}, "https://evilwebsite-aun.pages.dev")).status).toBe(403);
    expect((await call({}, "https://website-aun.pages.dev.evil.example")).status).toBe(403);
  });

  it("400 { message } with full CORS headers for a malformed body", async () => {
    const res = await snapshot(await call("{nope"));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_CORS_POST_OPTIONS,
      json: { message: "Invalid request body" },
    });
  });

  it("402 { message } with full CORS headers when verification fails", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "not-accepted" });
    const res = await snapshot(await call({ transactionId: "1" }));
    expect(res).toMatchObject({
      status: 402,
      headers: JSON_CORS_POST_OPTIONS,
      json: { message: "Could not verify transaction" },
    });
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), {
      context: "membership-complete verify",
      reason: "not-accepted",
    });
  });

  it("200 { success: true } and sends the exact Hub and EmailOctopus requests", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(member());
    const res = await snapshot(await call({ transactionId: "555001" }));
    expect(res).toMatchObject({
      status: 200,
      headers: JSON_CORS_POST_OPTIONS,
      json: { success: true },
    });

    const calls = vi.mocked(fetch).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]).toEqual([
      "https://hub.test/api/auth/invite",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer hk" },
        body: JSON.stringify({ email: "payer@example.org", type: "paid" }),
      },
    ]);
    expect(calls[1]).toEqual([
      EO_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: "eo",
          email_address: "payer@example.org",
          fields: { FirstName: "Ada", LastName: "Lovelace" },
          tags: ["member"],
          status: "SUBSCRIBED",
        }),
      },
    ]);
  });

  it("reports a failed EmailOctopus call with a redacted address and still returns 200", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(member({ formId: "1158315" }));
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "bad" }),
    } as Response);
    const res = await snapshot(await call({ transactionId: "555001" }));
    expect(res.status).toBe(200);
    expect(reportError).toHaveBeenCalledWith(new Error("EmailOctopus failed: 400"), {
      context: "membership-complete eo",
      email: "[redacted]@example.org",
      status: 400,
      body: { error: "bad" },
    });
  });

  it("reports a rejected EmailOctopus fetch and still returns 200", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(member({ formId: "1158315" }));
    const boom = new Error("network");
    vi.mocked(fetch).mockRejectedValue(boom);
    const res = await snapshot(await call({ transactionId: "555001" }));
    expect(res.status).toBe(200);
    expect(reportError).toHaveBeenCalledWith(boom, {
      context: "membership-complete eo",
      email: "[redacted]@example.org",
    });
  });

  it("OPTIONS 200 with CORS headers for an allowed origin", async () => {
    const request = new Request("https://techforpalestine.org/api/membership-complete", {
      method: "OPTIONS",
      headers: { Origin: ORIGIN },
    });
    const res = await snapshot(await OPTIONS({ request } as never));
    expect(res.status).toBe(200);
    expect(res.headers).toEqual({
      "access-control-allow-origin": ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    });
  });

  it("OPTIONS 403 with no headers for a foreign origin", async () => {
    const request = new Request("https://techforpalestine.org/api/membership-complete", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    });
    const res = await snapshot(await OPTIONS({ request } as never));
    expect(res).toMatchObject({ status: 403, headers: {}, text: "" });
  });
});
