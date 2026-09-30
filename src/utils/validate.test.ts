import { describe, expect, it } from "vitest";
import { firstTooLong, isEmail, isParsableUrl, readString } from "./validate";

describe("readString", () => {
  it("passes strings through", () => {
    expect(readString("abc")).toBe("abc");
  });

  it("maps non-strings to an empty string", () => {
    for (const v of [undefined, null, 0, 12, true, {}, [], new File([], "f")]) {
      expect(readString(v)).toBe("");
    }
  });
});

describe("isEmail", () => {
  it("accepts simple addresses", () => {
    expect(isEmail("a@b.co")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const v of ["nope", "a@b", "a b@c.d", "@b.c", ""]) expect(isEmail(v)).toBe(false);
  });
});

describe("isParsableUrl", () => {
  it("accepts anything new URL() parses, including non-http schemes", () => {
    expect(isParsableUrl("https://x.example")).toBe(true);
    expect(isParsableUrl("ftp://x.example")).toBe(true);
  });

  it("rejects unparsable input", () => {
    expect(isParsableUrl("not a url")).toBe(false);
  });
});

describe("firstTooLong", () => {
  it("returns undefined when everything fits, including exactly 2000", () => {
    expect(firstTooLong({ a: "x".repeat(2000), b: "" })).toBeUndefined();
  });

  it("names the first offending field with the existing message text", () => {
    expect(firstTooLong({ a: "ok", b: "x".repeat(2001), c: "y".repeat(2001) })).toBe(
      "Field 'b' exceeds maximum length of 2000 characters"
    );
  });

  it("honours a custom max", () => {
    expect(firstTooLong({ a: "abcd" }, 3)).toBe("Field 'a' exceeds maximum length of 3 characters");
  });
});
