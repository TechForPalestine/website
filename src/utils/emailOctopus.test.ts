import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/report-error", () => ({ reportError: vi.fn() }));

const { reportError } = await import("../lib/report-error");
const { EO_MEMBERS_LIST_URL, redactEmail, subscribeMember } = await import("./emailOctopus");

const INPUT = {
  email: "ada@example.org",
  firstName: "Ada",
  lastName: "Lovelace",
  tag: "Member",
  apiKey: "key",
  context: "test eo",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("redactEmail", () => {
  it("keeps only the domain", () => {
    expect(redactEmail("ada@example.org")).toBe("[redacted]@example.org");
  });
});

describe("subscribeMember", () => {
  it("posts the exact EmailOctopus payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await subscribeMember(INPUT);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(EO_MEMBERS_LIST_URL);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(
      '{"api_key":"key","email_address":"ada@example.org","fields":{"FirstName":"Ada","LastName":"Lovelace"},"tags":["Member"],"status":"SUBSCRIBED"}'
    );
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reports a non-2xx answer with a redacted email and swallows it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"e":1}', { status: 422 })));
    await expect(subscribeMember(INPUT)).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalledWith(new Error("EmailOctopus failed: 422"), {
      context: "test eo",
      email: "[redacted]@example.org",
      status: 422,
      body: { e: 1 },
    });
  });

  it("rejects on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(subscribeMember(INPUT)).rejects.toThrow("down");
  });
});
