import { describe, expect, it } from "vitest";
import { formatMessage } from "./sentry-webhook";

describe("formatMessage", () => {
  it("formats an issue payload", () => {
    const text = formatMessage({
      action: "created",
      data: {
        issue: {
          title: "TypeError: x",
          permalink: "https://sentry.io/i/1",
          project: { name: "website" },
          tags: [{ key: "environment", value: "production" }],
        },
      },
    });
    expect(text).toBe(
      "**[Website]** 🔴 New issue in **website** `production`\n**TypeError: x**\n[View in Sentry](https://sentry.io/i/1)"
    );
  });

  it("falls back to a generic label for unknown issue actions", () => {
    expect(formatMessage({ action: "foo", data: { issue: { metadata: { value: "m" } } } })).toBe(
      "**[Website]** Issue foo in ****\n**m**"
    );
  });

  it("formats an alert event payload", () => {
    const text = formatMessage({
      action: "triggered",
      data: {
        triggered_rule: "High volume",
        event: { title: "Boom", web_url: "https://s/e", environment: "prod" },
      },
    });
    expect(text).toBe(
      "**[Website]** 🚨 Alert triggered: High volume `prod`\n**Boom**\n[View in Sentry](https://s/e)"
    );
  });

  it("falls back for payloads with neither issue nor event", () => {
    expect(formatMessage({ action: "ping" })).toBe("**Sentry event**: `ping`");
    expect(formatMessage({})).toBe("**Sentry event**: `unknown`");
  });
});
