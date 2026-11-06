import { describe, expect, it } from "vitest";
import { localSessionTime } from "./localTime";

const STARTS_AT = "2026-11-20T20:30:00+01:00";

describe("localSessionTime", () => {
  it("restates the session in the visitor's zone", () => {
    expect(localSessionTime(STARTS_AT, "America/New_York")).toBe("Fri, 2:30 PM EST");
  });

  it("names the day when the session falls on another date locally", () => {
    expect(localSessionTime(STARTS_AT, "Asia/Tokyo")).toBe("Sat, 4:30 AM GMT+9");
  });

  it("returns null when the visitor is already on CET time", () => {
    expect(localSessionTime(STARTS_AT, "Europe/Berlin")).toBeNull();
    expect(localSessionTime(STARTS_AT, "Europe/Paris")).toBeNull();
  });

  it("returns null for an unknown zone or a bad date rather than throwing", () => {
    expect(localSessionTime(STARTS_AT, "Not/AZone")).toBeNull();
    expect(localSessionTime("nonsense", "America/New_York")).toBeNull();
  });
});
