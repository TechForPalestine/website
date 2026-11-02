import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/qgivVerify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/qgivVerify")>();
  return { ...actual, verifyQgivTransaction: vi.fn() };
});
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));
vi.mock("../../lib/membershipAnalytics", () => ({
  sendMembershipVerified: vi.fn().mockResolvedValue(undefined),
}));

const { verifyQgivTransaction } = await import("../../utils/qgivVerify");
const { reportError } = await import("../../lib/report-error");
const { sendMembershipVerified } = await import("../../lib/membershipAnalytics");
const { POST } = await import("../../pages/api/membership-complete");

const LOCALS = {
  runtime: { env: { HUB_API_URL: "https://hub.test", HUB_API_KEY: "k", EO_API_KEY: "eo" } },
} as unknown as App.Locals;

function request(body: unknown, origin = "https://techforpalestine.org") {
  return new Request("https://techforpalestine.org/api/membership-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

function call(body: unknown, origin?: string) {
  return POST({ request: request(body, origin), locals: LOCALS } as never);
}

describe("POST /api/membership-complete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refuses a forged Origin", async () => {
    const response = await call({ transactionId: "555001" }, "https://evil.example");
    expect(response.status).toBe(403);
    expect(verifyQgivTransaction).not.toHaveBeenCalled();
  });

  it("refuses a request with no transaction id", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "invalid-id" });
    const response = await call({ email: "attacker@example.org" });
    expect(response.status).toBe(402);
  });

  it("does not report an invalid-id failure to Sentry, since it never reached Qgiv", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "invalid-id" });
    await call({ email: "attacker@example.org" });
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reports a genuine verification failure to Sentry", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "not-accepted" });
    await call({ transactionId: "555001" });
    expect(reportError).toHaveBeenCalled();
  });

  it("never invites or subscribes when verification fails", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "not-accepted" });
    const response = await call({ transactionId: "555001" });
    expect(response.status).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignores a caller-supplied email and uses the one Qgiv reports", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({
      ok: true,
      transaction: {
        id: "555001",
        formId: "1116610",
        email: "payer@example.org",
        firstName: "Ada",
        lastName: "Lovelace",
        amount: "25.00",
        optedIn: true,
      },
    });

    const response = await call({ transactionId: "555001", email: "victim@example.org" });

    expect(response.status).toBe(200);
    const bodies = vi
      .mocked(fetch)
      .mock.calls.map(([, init]) => String((init as RequestInit).body));
    expect(bodies.join(" ")).toContain("payer@example.org");
    expect(bodies.join(" ")).not.toContain("victim@example.org");
  });

  it("ignores a caller-supplied tier and derives it from the verified form", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({
      ok: true,
      transaction: {
        id: "555002",
        formId: "1158315",
        email: "supporter@example.org",
        firstName: "",
        lastName: "",
        amount: "5.00",
        optedIn: true,
      },
    });

    await call({ transactionId: "555002", tier: "member" });

    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes("/api/auth/invite"))).toBe(false);
    const bodies = vi
      .mocked(fetch)
      .mock.calls.map(([, init]) => String((init as RequestInit).body));
    expect(bodies.join(" ")).toContain("Supporting Member");
  });

  it("records a verified membership server-side with the tier from Qgiv", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({
      ok: true,
      transaction: {
        id: "555003",
        formId: "1116610",
        email: "payer@example.org",
        firstName: "Ada",
        lastName: "Lovelace",
        amount: "25.00",
        optedIn: true,
      },
    });

    await call({ transactionId: "555003", tier: "Supporting Member" });

    expect(sendMembershipVerified).toHaveBeenCalledOnce();
    expect(vi.mocked(sendMembershipVerified).mock.calls[0][0]).toMatchObject({ tier: "member" });
  });

  it("does not record a membership whose verification failed", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "not-accepted" });
    await call({ transactionId: "555004" });
    expect(sendMembershipVerified).not.toHaveBeenCalled();
  });

  it("hands the analytics call to waitUntil and does not resend for a replayed transaction", async () => {
    const transaction = {
      id: "555005",
      formId: "1116610",
      email: "payer@example.org",
      firstName: "Ada",
      lastName: "Lovelace",
      amount: "25.00",
      optedIn: true,
    };
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: true, transaction });
    vi.mocked(sendMembershipVerified).mockResolvedValue(undefined);
    const claimed = new Set<string>();
    const kv = {
      get: async (key: string) => (claimed.has(key) ? "1" : null),
      put: async (key: string) => {
        claimed.add(key);
      },
    };
    const waitUntil = vi.fn();
    const locals = {
      runtime: { env: { ...LOCALS.runtime?.env, DROPPED_CONVERSIONS: kv }, ctx: { waitUntil } },
    } as unknown as App.Locals;
    const post = () =>
      POST({ request: request({ transactionId: "555005" }), locals } as never) as Promise<Response>;

    await post();
    const second = await post();

    expect(sendMembershipVerified).toHaveBeenCalledOnce();
    expect(waitUntil).toHaveBeenCalledOnce();
    expect(waitUntil.mock.calls[0][0]).toBeInstanceOf(Promise);
    expect(await second.json()).toMatchObject({ message: "Already processed" });
  });
});
