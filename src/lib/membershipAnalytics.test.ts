import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./navAssignment", () => ({ assignNavLabelVariant: vi.fn() }));
vi.mock("./report-error", () => ({ reportError: vi.fn() }));

const { assignNavLabelVariant } = await import("./navAssignment");
const { reportError } = await import("./report-error");
const { MEMBERSHIP_VERIFIED_EVENT, membershipPageUrl, sendMembershipVerified } = await import(
  "./membershipAnalytics"
);

function request(headers: Record<string, string> = {}) {
  return new Request("https://techforpalestine.org/api/membership-complete", {
    method: "POST",
    headers: {
      "user-agent": "Mozilla/5.0 Test",
      "cf-connecting-ip": "203.0.113.7",
      ...headers,
    },
  });
}

function sentBody(fetchImpl: ReturnType<typeof vi.fn>) {
  const [, init] = fetchImpl.mock.calls[0];
  return JSON.parse(String((init as RequestInit).body));
}

describe("membershipPageUrl", () => {
  it("uses a same-origin Referer without its query string", () => {
    const req = request({ referer: "https://techforpalestine.org/supporting-member?x=1" });
    expect(membershipPageUrl(req)).toBe("https://techforpalestine.org/supporting-member");
  });

  it("ignores a cross-origin or malformed Referer", () => {
    expect(membershipPageUrl(request({ referer: "https://evil.example/x" }))).toBe(
      "https://techforpalestine.org/membership"
    );
    expect(membershipPageUrl(request({ referer: "not a url" }))).toBe(
      "https://techforpalestine.org/membership"
    );
  });
});

describe("sendMembershipVerified", () => {
  afterEach(() => vi.clearAllMocks());

  it("sends the event with the variant, forwarding the visitor's UA and IP", async () => {
    vi.mocked(assignNavLabelVariant).mockResolvedValue("B");
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 });

    await sendMembershipVerified({ request: request(), locals: {}, tier: "member", fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://plausible.io/api/event");
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("user-agent")).toBe("Mozilla/5.0 Test");
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(vi.mocked(assignNavLabelVariant).mock.calls[0][2]).toEqual({ requireStable: true });
    expect(sentBody(fetchImpl)).toEqual({
      name: MEMBERSHIP_VERIFIED_EVENT,
      url: "https://techforpalestine.org/membership",
      domain: "techforpalestine.org",
      props: { membership_tier: "member", experiment: "nav-get-involved-label", variant: "B" },
    });
  });

  it("omits experiment props when the visitor is not in the test", async () => {
    vi.mocked(assignNavLabelVariant).mockResolvedValue(null);
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 });

    await sendMembershipVerified({ request: request(), locals: {}, tier: "member", fetchImpl });

    expect(sentBody(fetchImpl).props).toEqual({ membership_tier: "member" });
  });

  it("reports a rejected event and a network failure without throwing", async () => {
    vi.mocked(assignNavLabelVariant).mockResolvedValue("A");
    const rejected = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    await sendMembershipVerified({
      request: request(),
      locals: {},
      tier: "member",
      fetchImpl: rejected,
    });

    const failing = vi.fn().mockRejectedValue(new Error("network"));
    await expect(
      sendMembershipVerified({ request: request(), locals: {}, tier: "member", fetchImpl: failing })
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalledTimes(2);
  });
});
