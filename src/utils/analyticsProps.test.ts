import { describe, expect, it } from "vitest";
import { ANALYTICS_PROPS_META, readAnalyticsProps } from "./analyticsProps";

// Vitest runs in node, so the document is a minimal fake.
function docWith(content: string | null) {
  return {
    querySelector: () => (content === null ? null : { getAttribute: () => content }),
  } as unknown as Pick<Document, "querySelector">;
}

describe("readAnalyticsProps", () => {
  it("names the meta tag", () => expect(ANALYTICS_PROPS_META).toBe("t4p:analytics-props"));
  it("returns {} when there is no meta", () =>
    expect(readAnalyticsProps(docWith(null))).toEqual({}));
  it("parses a JSON object of strings", () =>
    expect(readAnalyticsProps(docWith('{"hero_photo":"speaker"}'))).toEqual({
      hero_photo: "speaker",
    }));
  it("returns {} for invalid JSON", () => expect(readAnalyticsProps(docWith("{nope"))).toEqual({}));
  it("returns {} for a JSON array", () => expect(readAnalyticsProps(docWith('["a"]'))).toEqual({}));
  it("drops non-string values", () =>
    expect(readAnalyticsProps(docWith('{"a":"x","b":1,"c":null}'))).toEqual({ a: "x" }));
});
