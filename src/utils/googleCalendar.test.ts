import { describe, expect, it } from "vitest";
import { googleCalendarUrl } from "./googleCalendar";

describe("googleCalendarUrl", () => {
  const url = new URL(
    googleCalendarUrl({
      title: "Tech for Palestine build session",
      startsAt: "2026-11-28T09:00:00-05:00",
      endsAt: "2026-11-28T13:00:00-05:00",
      details: "Sign up: https://buildwith.techforpalestine.org/",
    })
  );

  it("opens Google's prefilled event form", () => {
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("converts the times to UTC stamps", () => {
    expect(url.searchParams.get("dates")).toBe("20261128T140000Z/20261128T180000Z");
  });

  it("carries the title and details through encoded", () => {
    expect(url.searchParams.get("text")).toBe("Tech for Palestine build session");
    expect(url.searchParams.get("details")).toBe(
      "Sign up: https://buildwith.techforpalestine.org/"
    );
  });
});
