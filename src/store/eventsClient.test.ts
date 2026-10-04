import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/report-error", () => ({ reportError: vi.fn() }));

import { hasMeaningfulDescription, parseIcsCalendar, primaryEventLink } from "./eventsClient";

function vevent(lines: string[]): string {
  return ["BEGIN:VEVENT", ...lines, "END:VEVENT"].join("\r\n");
}
function calendar(...events: string[]): string {
  return ["BEGIN:VCALENDAR", ...events, "END:VCALENDAR"].join("\r\n");
}

describe("parseIcsCalendar", () => {
  it("unfolds continuation lines", () => {
    const [event] = parseIcsCalendar(
      calendar(
        vevent([
          "UID:a",
          "SUMMARY:A very long",
          "  title folded",
          "DTSTART;TZID=America/New_York:20260722T190000",
        ])
      )
    );
    expect(event.title).toBe("A very long title folded");
  });

  it("keeps wall clock time and resolves the TZID to UTC", () => {
    const [event] = parseIcsCalendar(
      calendar(
        vevent([
          "UID:a",
          "SUMMARY:Timed",
          "DTSTART;TZID=America/New_York:20260722T190000",
          "DTEND;TZID=America/New_York:20260722T200000",
        ])
      )
    );
    expect(event.date).toBe("2026-07-22");
    expect(event.time).toBe("7:00 PM");
    expect(event.dateUtcIso).toBe("2026-07-22T23:00:00.000Z");
    expect(event.endUtcIso).toBe("2026-07-23T00:00:00.000Z");
  });

  it("falls back to start + 1hr when DTEND is missing", () => {
    const [event] = parseIcsCalendar(
      calendar(vevent(["UID:a", "SUMMARY:No end", "DTSTART:20260722T190000Z"]))
    );
    expect(event.dateUtcIso).toBe("2026-07-22T19:00:00.000Z");
    expect(event.endUtcIso).toBe("2026-07-22T20:00:00.000Z");
  });

  it("handles all-day events with no time", () => {
    const [event] = parseIcsCalendar(
      calendar(vevent(["UID:a", "SUMMARY:All day", "DTSTART;VALUE=DATE:20260801"]))
    );
    expect(event.date).toBe("2026-08-01");
    expect(event.time).toBeUndefined();
  });

  it("skips events missing UID, SUMMARY or DTSTART and events tagged testing", () => {
    const events = parseIcsCalendar(
      calendar(
        vevent(["SUMMARY:No uid", "DTSTART:20260722T190000Z"]),
        vevent(["UID:b", "DTSTART:20260722T190000Z"]),
        vevent(["UID:c", "SUMMARY:No start"]),
        vevent(["UID:d", "SUMMARY:Tagged", "DTSTART:20260722T190000Z", "CATEGORIES:Testing,Other"]),
        vevent(["UID:e", "SUMMARY:Kept", "DTSTART:20260722T190000Z", "CATEGORIES:Talk, Panel"])
      )
    );
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("e");
    expect(events[0].tags).toEqual(["talk", "panel"]);
  });

  it("prefers a RECURRENCE-ID override over the master for the same occurrence", () => {
    const events = parseIcsCalendar(
      calendar(
        vevent(["UID:r", "SUMMARY:Master", "DTSTART:20260722T190000Z"]),
        vevent([
          "UID:r",
          "SUMMARY:Override",
          "DTSTART:20260722T190000Z",
          "RECURRENCE-ID:20260722T190000Z",
        ])
      )
    );
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Override");
  });

  it("keeps the richer community call when two share a calendar day", () => {
    const events = parseIcsCalendar(
      calendar(
        vevent(["UID:p", "SUMMARY:Community monthly call", "DTSTART:20260710T150000Z"]),
        vevent([
          "UID:q",
          "SUMMARY:Community monthly call July 2026",
          "DTSTART:20260710T170000Z",
          "CATEGORIES:community",
          "X-RECORDING-URL:https://example.test/rec",
        ]),
        vevent(["UID:o", "SUMMARY:Other", "DTSTART:20260710T170000Z"])
      )
    );
    const titles = events.map((e) => e.title).sort();
    expect(titles).toEqual(["Community monthly call July 2026", "Other"]);
  });

  it("strips the organizer metadata block and inline register lines", () => {
    const [event] = parseIcsCalendar(
      calendar(
        vevent([
          "UID:a",
          "SUMMARY:Desc",
          "DTSTART:20260722T190000Z",
          "DESCRIPTION:Join us\\nRegister here:\\nhttps://example.test/r\\nMore text\\n\\nOrganizer: bob\\nTags: x",
        ])
      )
    );
    expect(event.description).toBe("Join us\nMore text");
  });

  it("classifies the URL property and defaults the image", () => {
    const [reg, map, watch] = parseIcsCalendar(
      calendar(
        vevent(["UID:1", "SUMMARY:R", "DTSTART:20260722T190000Z", "URL:https://zoom.us/j/1"]),
        vevent(["UID:2", "SUMMARY:M", "DTSTART:20260723T190000Z", "URL:https://goo.gl/maps/x"]),
        vevent([
          "UID:3",
          "SUMMARY:W",
          "DTSTART:20260724T190000Z",
          "URL:https://youtube.com/@x",
          "LOCATION:https://youtube.com/@x",
        ])
      )
    ).sort((a, b) => a.id.localeCompare(b.id));
    expect(reg.registerLink).toBe("https://zoom.us/j/1");
    expect(reg.link).toBe("https://zoom.us/j/1");
    expect(map.locationLink).toBe("https://goo.gl/maps/x");
    expect(watch.watchLink).toBe("https://youtube.com/@x");
    expect(watch.location).toBe("");
    expect(watch.image).toBe("/images/default.jpg");
  });
});

describe("event link helpers", () => {
  const base = parseIcsCalendar(
    calendar(vevent(["UID:a", "SUMMARY:T", "DTSTART:20260722T190000Z"]))
  )[0];

  it("primaryEventLink never offers registration for past events", () => {
    const event = { ...base, registerLink: "https://r.test", watchLink: "https://w.test" };
    expect(primaryEventLink(event, false)).toEqual({ link: "https://r.test", label: "Register" });
    expect(primaryEventLink(event, true)).toEqual({
      link: "https://w.test",
      label: "Watch online",
    });
    expect(primaryEventLink(base, true)).toEqual({ link: "", label: "" });
  });

  it("hasMeaningfulDescription needs at least 80 trimmed chars", () => {
    expect(hasMeaningfulDescription({ ...base, description: "short" })).toBe(false);
    expect(hasMeaningfulDescription({ ...base, description: `  ${"x".repeat(80)}  ` })).toBe(true);
    expect(hasMeaningfulDescription(base)).toBe(false);
  });
});
