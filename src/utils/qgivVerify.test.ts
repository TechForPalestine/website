import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DONATION_FORMS,
  MEMBERSHIP_FORMS,
  QGIV_API_BASE,
  isValidTransactionId,
  verifyQgivTransaction,
} from "./qgivVerify";

describe("isValidTransactionId", () => {
  it("accepts a plain numeric Qgiv id", () => {
    expect(isValidTransactionId("1094620")).toBe(true);
  });

  it("rejects a non-string", () => {
    expect(isValidTransactionId(1094620)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidTransactionId("")).toBe(false);
  });

  it("rejects path traversal, which would escape the API URL", () => {
    expect(isValidTransactionId("../../admin/api")).toBe(false);
  });

  it("rejects a value longer than 64 characters", () => {
    expect(isValidTransactionId("1".repeat(65))).toBe(false);
  });
});

describe("form allowlists", () => {
  it("grants a Hub invite only to the Pilot Membership Form", () => {
    expect(MEMBERSHIP_FORMS["1116610"]).toEqual({ tag: "member", hubInvite: true });
  });

  it("tags supporting members without a Hub invite", () => {
    expect(MEMBERSHIP_FORMS["1158315"]).toEqual({
      tag: "Supporting Member",
      hubInvite: false,
    });
  });

  it("does not let a donation form reach the membership endpoint", () => {
    expect(MEMBERSHIP_FORMS["1094620"]).toBeUndefined();
  });

  it("does not let a membership form reach the donation endpoint", () => {
    expect(DONATION_FORMS["1116610"]).toBeUndefined();
  });

  it("excludes the Qgiv Test Form from both allowlists", () => {
    expect(MEMBERSHIP_FORMS["1122160"]).toBeUndefined();
    expect(DONATION_FORMS["1122160"]).toBeUndefined();
  });
});

const LOCALS = { runtime: { env: { QGIV_API_TOKEN: "test-token" } } } as unknown as App.Locals;
const MEMBERSHIP_IDS = ["1116610", "1158315"] as const;

function qgivResponse(overrides: Record<string, unknown> = {}) {
  return {
    transactions: [
      {
        id: "555001",
        formId: "1116610",
        form: { id: "1116610", name: "Pilot Membership Form" },
        transStatus: "Accepted",
        contactEmail: "payer@example.org",
        firstName: "Ada",
        lastName: "Lovelace",
        value: "25.00",
        optedIn: true,
        isRecurring: "y",
        ...overrides,
      },
    ],
  };
}

function mockFetchJson(payload: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => payload } as Response);
}

describe("verifyQgivTransaction", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the transaction Qgiv reports, not anything the caller sent", async () => {
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({
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
  });

  it("sends the token in the request body, never in the URL", async () => {
    const fetchMock = mockFetchJson(qgivResponse());
    vi.stubGlobal("fetch", fetchMock);

    await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${QGIV_API_BASE}/555001.json`);
    expect(String(url)).not.toContain("test-token");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain("token=test-token");
  });

  it("refuses a malformed id without calling Qgiv at all", async () => {
    const fetchMock = mockFetchJson(qgivResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyQgivTransaction("../secrets", MEMBERSHIP_IDS, LOCALS);

    expect(result).toEqual({ ok: false, reason: "invalid-id" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the token is not configured", async () => {
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, {
      runtime: { env: {} },
    } as unknown as App.Locals);
    expect(result).toEqual({ ok: false, reason: "not-configured" });
  });

  it("refuses a declined payment", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ transStatus: "Declined" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "not-accepted" });
  });

  it("refuses a transaction from a form the endpoint does not serve", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson(qgivResponse({ formId: "1094620", form: { id: "1094620" } }))
    );
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "form-not-allowed" });
  });

  it("refuses the Qgiv Test Form", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ formId: "1122160" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "form-not-allowed" });
  });

  it("refuses a record whose id does not match the one requested", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ id: "999999" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "lookup-failed" });
  });

  it("fails closed on a non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetchJson({}, false));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "lookup-failed" });
  });

  it("fails closed when the network throws or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "lookup-failed" });
  });

  it("refuses a transaction with no contact email", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ contactEmail: "" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "no-email" });
  });
});
