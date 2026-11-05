import { describe, expect, it } from "vitest";
import {
  MAX_TEXT_LENGTH,
  requiredText,
  submitErrorMessage,
  validEmail,
  validLink,
  withinCap,
} from "./endorsementValidation";
import { isEmail, isParsableUrl } from "../../utils/validate";

describe("endorsement form rules", () => {
  it("treats empty and blank-only text as missing", () => {
    const rule = requiredText("Required");
    expect(rule("")).toBe("Required");
    expect(rule("   ")).toBe("Required");
    expect(rule("Boycott campaign")).toBe(true);
  });

  it("caps free text at the server limit", () => {
    expect(withinCap("a".repeat(MAX_TEXT_LENGTH))).toBe(true);
    expect(withinCap("a".repeat(MAX_TEXT_LENGTH + 1))).toMatch(/under 2,000 characters/);
  });

  it("rejects every email the server rejects", () => {
    for (const value of ["", "name", "name@host", "a@b@c.org", "name @example.org"]) {
      expect(isEmail(value)).toBe(false);
      expect(validEmail(value)).not.toBe(true);
    }
    expect(validEmail("name@example.org")).toBe(true);
  });

  it("only accepts parsable http(s) links", () => {
    for (const value of ["", "example.org", "ftp://example.org", "https://exa mple.org"]) {
      expect(validLink(value)).not.toBe(true);
    }
    expect(isParsableUrl("https://example.org/campaign")).toBe(true);
    expect(validLink("https://example.org/campaign")).toBe(true);
  });

  it("shows server validation messages but hides other failures", () => {
    expect(submitErrorMessage(400, "Invalid email address")).toBe("Invalid email address");
    expect(submitErrorMessage(403, "Forbidden")).not.toMatch(/Forbidden/);
    expect(submitErrorMessage(500, undefined)).toMatch(/on our side/);
  });
});
