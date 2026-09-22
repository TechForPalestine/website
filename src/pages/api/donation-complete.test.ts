import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/qgivVerify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/qgivVerify")>();
  return { ...actual, verifyQgivTransaction: vi.fn() };
});
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { verifyQgivTransaction } = await import("../../utils/qgivVerify");
const { reportError } = await import("../../lib/report-error");
const { POST } = await import("./donation-complete");

const LOCALS = { runtime: { env: { EO_API_KEY: "eo" } } } as unknown as App.Locals;

function call(body: unknown, origin = "https://techforpalestine.org") {
  const request = new Request("https://techforpalestine.org/api/donation-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
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

describe("POST /api/donation-complete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refuses an unverifiable transaction", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "lookup-failed" });
    const response = await call({ transactionId: "777001" });
    expect(response.status).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not report an invalid-id failure to Sentry, since it never reached Qgiv", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "invalid-id" });
    await call({ transactionId: "not-a-real-id" });
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reports a genuine verification failure to Sentry", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "lookup-failed" });
    await call({ transactionId: "777001" });
    expect(reportError).toHaveBeenCalled();
  });

  it("does not subscribe a donor who declined the mailing list", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor({ optedIn: false }));
    const response = await call({ transactionId: "777001" });
    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("subscribes the address Qgiv reports, tagged donor", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor());
    const response = await call({ transactionId: "777001", email: "victim@example.org" });

    expect(response.status).toBe(200);
    const body = String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body);
    expect(body).toContain("donor@example.org");
    expect(body).not.toContain("victim@example.org");
    expect(body).toContain("donor");
  });
});
