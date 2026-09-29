import { describe, expect, test } from "vitest";
import {
  aboutYouHelper,
  MEMBER_BENEFITS,
  showCalculator,
  SUPPORTING_BENEFITS,
  TIER_DESCRIPTIONS,
} from "./joinFlowContent";

describe("tier card content", () => {
  test("descriptions use the client's short taglines", () => {
    expect(TIER_DESCRIPTIONS.member).toBe("Build the movement");
    expect(TIER_DESCRIPTIONS.supporting).toBe("Fund the movement");
  });

  test("member-only benefits come last, volunteer before chat, both with arrow markers", () => {
    const texts = MEMBER_BENEFITS.map((b) => b.text);
    expect(texts.slice(-2)).toEqual([
      "Volunteer or mentor on projects",
      "Join the private member chat",
    ]);
    expect(MEMBER_BENEFITS.slice(-2).every((b) => b.marker === "arrow")).toBe(true);
    expect(MEMBER_BENEFITS.slice(0, -2).every((b) => b.marker === "dot")).toBe(true);
  });

  test("member list keeps every existing benefit exactly once", () => {
    expect(MEMBER_BENEFITS.map((b) => b.text).sort()).toEqual(
      [
        "Dues fund Palestinian liberation initiatives",
        "Volunteer or mentor on projects",
        "Attend community events",
        "Get exclusive project updates",
        "Join the private member chat",
      ].sort(),
    );
  });

  test("supporting benefits are unchanged and all dots", () => {
    expect(SUPPORTING_BENEFITS.map((b) => b.text)).toEqual([
      "Dues fund Palestinian liberation initiatives",
      "Attend community events",
      "Get exclusive project updates",
      "(Optionally) Mentor projects",
    ]);
    expect(SUPPORTING_BENEFITS.every((b) => b.marker === "dot")).toBe(true);
  });
});

describe("showCalculator", () => {
  test("shows the calculator for members", () => {
    expect(showCalculator("member", false)).toBe(true);
  });

  test("hides the calculator for supporting members on /membership", () => {
    expect(showCalculator("supporting", false)).toBe(false);
  });

  test("hideCalculator always wins (the /supporting-member page)", () => {
    expect(showCalculator("supporting", true)).toBe(false);
    expect(showCalculator("member", true)).toBe(false);
  });
});

describe("aboutYouHelper", () => {
  test("/membership keeps the full dues line", () => {
    expect(aboutYouHelper(undefined)).toBe(
      "Dues are pay-what-you-can · Waivers available · Tax deductible in the US",
    );
  });

  test("/supporting-member drops pay-what-you-can and waivers", () => {
    expect(aboutYouHelper("supporting")).toBe("Tax deductible in the US");
  });
});
