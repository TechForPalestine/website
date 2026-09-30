import { describe, expect, it } from "vitest";
import type { EventItem } from "../../store/eventsClient";
import { eventPath } from "../../utils/eventSlug";
import { groupIntoSections } from "../../utils/eventSections";
import {
  eventSlugFromPathname,
  formatUpcomingCount,
  hasPastEvents,
  resolveSelectedEvent,
  upcomingTeaser,
} from "./eventsLogic";

const NOW = Date.parse("2026-06-15T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: "abc123@events.t4p",
    title: "Tech for Palestine Roundtable: Data",
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

describe("eventSlugFromPathname", () => {
  it("returns the segment after /events/", () => {
    expect(eventSlugFromPathname("/events/roundtable-data-abc123")).toBe("roundtable-data-abc123");
  });

  it("returns null for the listing page and unrelated paths", () => {
    expect(eventSlugFromPathname("/events")).toBeNull();
    expect(eventSlugFromPathname("/about")).toBeNull();
  });
});

describe("resolveSelectedEvent", () => {
  const upcoming = makeEvent();
  const past = makeEvent({
    id: "old1@events.t4p",
    title: "Past Call",
    dateUtcIso: new Date(NOW - 10 * DAY_MS).toISOString(),
  });
  const events = [upcoming, past];

  it("finds an upcoming event from its path", () => {
    expect(resolveSelectedEvent(events, eventPath(upcoming), NOW)).toEqual({
      event: upcoming,
      isPast: false,
    });
  });

  it("marks past events as past", () => {
    expect(resolveSelectedEvent(events, eventPath(past), NOW)).toEqual({
      event: past,
      isPast: true,
    });
  });

  it("returns null for /events, unknown slugs and non-event paths", () => {
    expect(resolveSelectedEvent(events, "/events", NOW)).toBeNull();
    expect(resolveSelectedEvent(events, "/events/nope-zzz", NOW)).toBeNull();
    expect(resolveSelectedEvent(events, "/about", NOW)).toBeNull();
  });
});

describe("upcomingTeaser", () => {
  it("is empty without a description", () => {
    expect(upcomingTeaser(undefined)).toBe("");
    expect(upcomingTeaser("")).toBe("");
  });

  it("falls back to the first paragraph excerpt", () => {
    expect(upcomingTeaser("Join us for a talk.\n\nMore later.")).toBe("Join us for a talk.");
  });

  it("features speakers when the description lists them", () => {
    const description = "Intro.\n\n**OUR SPEAKERS**\n\n**MO HAMZEH - Creator**\n\n**JANE DOE - Dev**";
    expect(upcomingTeaser(description)).toBe("Featuring Mo Hamzeh and Jane Doe");
  });
});

describe("formatUpcomingCount", () => {
  it("zero-pads to two digits", () => {
    expect(formatUpcomingCount(0)).toBe("00");
    expect(formatUpcomingCount(7)).toBe("07");
    expect(formatUpcomingCount(12)).toBe("12");
  });
});

describe("hasPastEvents", () => {
  it("is false when nothing has happened yet", () => {
    expect(hasPastEvents(groupIntoSections([makeEvent()], NOW))).toBe(false);
  });

  it("is true once any section has a past event", () => {
    const past = makeEvent({
      tags: ["roundtable"],
      dateUtcIso: new Date(NOW - 3 * DAY_MS).toISOString(),
    });
    expect(hasPastEvents(groupIntoSections([past], NOW))).toBe(true);
  });
});
