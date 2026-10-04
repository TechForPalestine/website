import { describe, expect, it } from "vitest";
import {
  beforeBreadcrumb,
  beforeSend,
  beforeSendTransaction,
  sanitizeError,
  scrubString,
} from "./sentry-scrub";

const SECRET = "https://cal.example.com/feed.ics?token=abc123";
const SCRUBBED = "https://cal.example.com/feed.ics?[redacted]";

describe("scrubString", () => {
  it("redacts query strings but keeps the URL path", () => {
    expect(scrubString(`fetch failed for ${SECRET} (500)`)).toBe(
      `fetch failed for ${SCRUBBED} (500)`
    );
  });
  it("leaves strings without queries alone", () => {
    expect(scrubString("https://a.example/x")).toBe("https://a.example/x");
  });
});

describe("beforeSend", () => {
  it("scrubs message, exception values, breadcrumbs and request", () => {
    const event = {
      message: `bad ${SECRET}`,
      exception: { values: [{ value: `boom ${SECRET}` }] },
      breadcrumbs: [{ message: `GET ${SECRET}`, data: { url: SECRET } }],
      request: { url: SECRET, query_string: "token=abc123" },
    };
    const out = beforeSend(event as never) as unknown as typeof event;
    expect(out.message).toBe(`bad ${SCRUBBED}`);
    expect(out.exception.values[0].value).toBe(`boom ${SCRUBBED}`);
    expect(out.breadcrumbs[0].message).toBe(`GET ${SCRUBBED}`);
    expect(out.breadcrumbs[0].data.url).toBe(SCRUBBED);
    expect(out.request.url).toBe(SCRUBBED);
    expect(out.request).not.toHaveProperty("query_string");
  });
});

describe("beforeBreadcrumb", () => {
  it("cuts relative url data after the query marker", () => {
    const crumb = beforeBreadcrumb({ data: { to: "/page?secret=1" } }) as { data: { to: string } };
    expect(crumb.data.to).toBe("/page?[redacted]");
  });
});

describe("beforeSendTransaction", () => {
  it("scrubs request and span data", () => {
    const event = {
      request: { url: SECRET, query_string: "x=1" },
      spans: [{ description: `GET ${SECRET}`, data: { "http.url": SECRET } }],
    };
    const out = beforeSendTransaction(event as never) as unknown as typeof event;
    expect(out.request.url).toBe(SCRUBBED);
    expect(out.request).not.toHaveProperty("query_string");
    expect(out.spans[0].description).toBe(`GET ${SCRUBBED}`);
    expect(out.spans[0].data["http.url"]).toBe(SCRUBBED);
  });
});

describe("sanitizeError", () => {
  it("scrubs message and stack of Errors", () => {
    const err = sanitizeError(new Error(`x ${SECRET}`)) as Error;
    expect(err.message).toBe(`x ${SCRUBBED}`);
    expect(err.stack).not.toContain("abc123");
  });
  it("passes non-string non-errors through", () => {
    expect(sanitizeError(42)).toBe(42);
  });
});
