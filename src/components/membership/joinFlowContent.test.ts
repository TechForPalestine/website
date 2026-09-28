import { describe, expect, test } from "vitest";
import { MEMBER_BENEFITS, SUPPORTING_BENEFITS, TIER_DESCRIPTIONS } from "./joinFlowContent";

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
