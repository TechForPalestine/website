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
const { POST, OPTIONS } = await import("../../pages/api/donation-complete");

const EO_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

const LOCALS = {
  runtime: { env: { EO_API_KEY: "eo" }, ctx: { waitUntil: vi.fn() } },
} as unknown as App.Locals;

function call(body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers.Origin = origin;
  const request = new Request("https://techforpalestine.org/api/donation-complete", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return POST({ request, locals: LOCALS } as never);
}

function donor(overrides: Record<string, unknown> = {}) {
  return {
    ok: true as const,
    transaction: {
      id: "777001",
      formId: "1094620",
      email: "donor@example.org",
      firstName: "Grace",
      lastName: "Hopper",
      amount: "50.00",
      optedIn: true,
      ...overrides,
    },
  };
}

describe("donation-complete responses", () => {
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

  it("rejects look-alikes of the preview suffix", async () => {
    expect((await call({}, "https://evilwebsite-aun.pages.dev")).status).toBe(403);
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
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "lookup-failed" });
    const res = await snapshot(await call({ transactionId: "1" }));
    expect(res).toMatchObject({
      status: 402,
      headers: JSON_CORS_POST_OPTIONS,
      json: { message: "Could not verify transaction" },
    });
  });

  it("200 'Not opted in' with full CORS headers", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor({ optedIn: false }));
    const res = await snapshot(await call({ transactionId: "777001" }));
    expect(res).toMatchObject({
      status: 200,
      headers: JSON_CORS_POST_OPTIONS,
      json: { success: true, message: "Not opted in" },
    });
  });

  it("200 { success: true } and sends the exact EmailOctopus request", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor());
    const res = await snapshot(await call({ transactionId: "777001" }));
    expect(res).toMatchObject({
      status: 200,
      headers: JSON_CORS_POST_OPTIONS,
      json: { success: true },
    });
    expect(vi.mocked(fetch).mock.calls).toEqual([
      [
        EO_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: "eo",
            email_address: "donor@example.org",
            fields: { FirstName: "Grace", LastName: "Hopper" },
            tags: ["donor"],
            status: "SUBSCRIBED",
          }),
        },
      ],
    ]);
  });

  it("reports a non-ok EmailOctopus response with a redacted address and still returns 200", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor());
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "bad" }),
    } as Response);
    const res = await snapshot(await call({ transactionId: "777001" }));
    expect(res.status).toBe(200);
    expect(reportError).toHaveBeenCalledWith(new Error("EmailOctopus failed: 500"), {
      context: "donation-complete eo",
      email: "[redacted]@example.org",
      status: 500,
      body: { error: "bad" },
    });
  });

  it("500 { message } when the EmailOctopus fetch rejects", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor());
    const boom = new Error("network");
    vi.mocked(fetch).mockRejectedValue(boom);
    const res = await snapshot(await call({ transactionId: "777001" }));
    expect(res).toMatchObject({
      status: 500,
      headers: JSON_CORS_POST_OPTIONS,
      json: { message: "Failed to process request" },
    });
    expect(reportError).toHaveBeenCalledWith(boom, { context: "donation-complete" });
  });

  it("OPTIONS mirrors the membership route", async () => {
    const ok = new Request("https://techforpalestine.org/api/donation-complete", {
      method: "OPTIONS",
      headers: { Origin: ORIGIN },
    });
    const okRes = await snapshot(await OPTIONS({ request: ok } as never));
    expect(okRes.status).toBe(200);
    expect(okRes.headers["access-control-allow-origin"]).toBe(ORIGIN);

    const bad = new Request("https://techforpalestine.org/api/donation-complete", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    });
    expect(await snapshot(await OPTIONS({ request: bad } as never))).toMatchObject({
      status: 403,
      headers: {},
      text: "",
    });
  });
});
