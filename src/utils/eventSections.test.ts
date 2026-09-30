import { describe, expect, it } from "vitest";
import type { EventItem } from "../store/eventsClient";
import {
  displayTitle,
  getUpcomingEvents,
  groupIntoSections,
  isEventPast,
  sectionForEvent,
} from "./eventSections";

const NOW = Date.parse("2026-06-15T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "e1",
    title: "Untitled",
    date: "2026-06-20",
    status: "",
    location: "",
    locationLink: "",
    watchLink: "",
    image: "/images/default.jpg",
    link: "",
    tags: [],
    dateUtcIso: new Date(NOW + 5 * DAY_MS).toISOString(),
    endUtcIso: null,
    ...overrides,
  };
}

describe("sectionForEvent", () => {
  it("routes by tag", () => {
    expect(sectionForEvent(makeEvent({ tags: ["book club"] }))?.key).toBe("book-club");
  });

  it("puts a multi-tag event in the first matching section", () => {
    const event = makeEvent({ tags: ["webinar", "roundtable"] });
    expect(sectionForEvent(event)?.key).toBe("roundtable");
  });

  it("falls back to title keywords when no tag matches", () => {
    const event = makeEvent({ title: "June Community Call" });
    expect(sectionForEvent(event)?.key).toBe("community-calls");
  });

  it("returns null when nothing matches", () => {
    expect(sectionForEvent(makeEvent({ title: "Bake sale", tags: ["misc"] }))).toBeNull();
  });
});

describe("displayTitle", () => {
  it("strips the section prefix", () => {
    const event = makeEvent({
      title: "Roundtable: Hiring Palestinian Talent",
      tags: ["roundtable"],
    });
    expect(displayTitle(event)).toBe("Hiring Palestinian Talent");
  });

  it("keeps the title when it has no section prefix", () => {
    const event = makeEvent({ title: "Hiring Palestinian Talent", tags: ["roundtable"] });
    expect(displayTitle(event)).toBe("Hiring Palestinian Talent");
  });

  it("keeps the title of an unsectioned event", () => {
    expect(displayTitle(makeEvent({ title: "Bake sale" }))).toBe("Bake sale");
  });
});

describe("getUpcomingEvents", () => {
  it("returns in-window events soonest first and skips past ones", () => {
    const soon = makeEvent({
      id: "soon",
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW + 2 * DAY_MS).toISOString(),
    });
    const later = makeEvent({
      id: "later",
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW + 9 * DAY_MS).toISOString(),
    });
    const past = makeEvent({
      id: "past",
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW - DAY_MS).toISOString(),
    });

    const { items, hasMore } = getUpcomingEvents([later, past, soon], 30, NOW);

    expect(items.map((i) => i.event.id)).toEqual(["soon", "later"]);
    expect(hasMore).toBe(false);
  });

  it("flags hasMore when events fall beyond the window", () => {
    const far = makeEvent({
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW + 60 * DAY_MS).toISOString(),
    });
    const { items, hasMore } = getUpcomingEvents([far], 30, NOW);
    expect(items).toEqual([]);
    expect(hasMore).toBe(true);
  });

  it("ignores events that belong to no section", () => {
    expect(getUpcomingEvents([makeEvent()], 30, NOW).items).toEqual([]);
  });
});

describe("groupIntoSections", () => {
  it("keeps only past events, newest first, in section order", () => {
    const older = makeEvent({
      id: "older",
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW - 10 * DAY_MS).toISOString(),
    });
    const newer = makeEvent({
      id: "newer",
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW - 2 * DAY_MS).toISOString(),
    });
    const podcast = makeEvent({
      id: "pod",
      tags: ["podcast"],
      dateUtcIso: new Date(NOW - DAY_MS).toISOString(),
    });
    const upcoming = makeEvent({ id: "up", tags: ["roundtable"] });

    const sections = groupIntoSections([older, upcoming, newer, podcast], NOW);

    expect(sections.map((s) => s.def.key)).toEqual(["occupied-tech-podcast", "roundtable"]);
    expect(sections[1].past.map((e) => e.id)).toEqual(["newer", "older"]);
  });
});

describe("isEventPast", () => {
  it("is true before now, false after", () => {
    expect(isEventPast(makeEvent({ dateUtcIso: new Date(NOW - 1).toISOString() }), NOW)).toBe(true);
    expect(isEventPast(makeEvent({ dateUtcIso: new Date(NOW + 1).toISOString() }), NOW)).toBe(
      false
    );
  });

  it("treats an unresolvable date as past", () => {
    expect(isEventPast(makeEvent({ dateUtcIso: null }), NOW)).toBe(true);
  });
});
