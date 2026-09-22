import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/qgivVerify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/qgivVerify")>();
  return { ...actual, verifyQgivTransaction: vi.fn() };
});
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { verifyQgivTransaction } = await import("../../utils/qgivVerify");
const { POST } = await import("./membership-complete");

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
    const bodies = vi.mocked(fetch).mock.calls.map(([, init]) => String((init as RequestInit).body));
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
    const bodies = vi.mocked(fetch).mock.calls.map(([, init]) => String((init as RequestInit).body));
    expect(bodies.join(" ")).toContain("Supporting Member");
  });
});
