import type { EventItem } from "../store/eventsClient";
import { youtubeThumbnailSources } from "./youtubeThumbnail";

export interface EventSectionDef {
  key: string;
  title: string;
  subtitle: string;
  matchTags: string[]; // lowercase feed CATEGORIES tags that route into this section
  // Words checked against the event title (all must appear, case-insensitive)
  // when no tag match was found — the source calendar is inconsistent about
  // tagging recurring events, so the name is the more reliable signal here.
  titleKeywords?: string[];
}

export interface EventSection {
  def: EventSectionDef;
  past: EventItem[];
}

// Order matters: sections are checked top to bottom and the first match wins,
// so a multi-tag event (e.g. "webinar,roundtable") lands in Roundtable, not Others.
export const SECTION_DEFS: EventSectionDef[] = [
  {
    key: "in-person-events",
    title: "In-Person Events",
    subtitle: "Join us at conferences, meetups and hackathons in a city near you!",
    matchTags: ["in-person event"],
  },
  {
    key: "occupied-tech-podcast",
    title: "Occupied Tech Podcast",
    subtitle: "Conversations on tech, occupation, and resistance.",
    matchTags: ["occupied tech podcast", "podcast"],
  },
  {
    key: "community-calls",
    title: "Community Calls",
    subtitle: "Monthly updates from T4P, the Incubator, and the wider community.",
    matchTags: ["community monthly call"],
    titleKeywords: ["community", "call"],
  },
  {
    key: "roundtable",
    title: "Roundtable",
    subtitle: "Discussions with organizers, founders, and allies on today's issues.",
    matchTags: ["roundtable"],
  },
  {
    key: "book-club",
    title: "Book Club",
    subtitle: "Reading and discussing work that shapes the movement.",
    matchTags: ["book club"],
  },
];

// Events whose tags/title don't match any named section are dropped —
// there's no catch-all "Others" bucket.
export function sectionForEvent(event: EventItem): EventSectionDef | null {
  for (const def of SECTION_DEFS) {
    if (event.tags.some((tag) => def.matchTags.includes(tag))) return def;
  }

  // No tag placed it — fall back to the event's title for sections that
  // define keywords, since the feed's CATEGORIES tagging is unreliable.
  const title = event.title.toLowerCase();
  for (const def of SECTION_DEFS) {
    if (def.titleKeywords?.every((word) => title.includes(word))) return def;
  }

  return null;
}

// Organizers often title events "<Category>: <subject>" (e.g. "Book Club:
// The General's Son by Miko Peled", "Roundtable: Hiring Palestinian Talent")
// — redundant once the category is already shown as a tag or section
// heading. Strips that prefix when it matches the event's own section title;
// leaves the title untouched for sections that don't follow this convention
// (Community Calls, In-Person Events) since their titles carry other
// information (the month, a city name) that isn't just the category name.
export function displayTitle(event: EventItem): string {
  const def = sectionForEvent(event);
  if (!def) return event.title;

  const prefix = `${def.title}:`;
  if (!event.title.toLowerCase().startsWith(prefix.toLowerCase())) return event.title;

  return event.title.slice(prefix.length).trim();
}

export interface PreviewImageSources {
  primary: string;
  fallback: string | null;
}

// A real recording/stream thumbnail is generally more identifiable at a
// glance than a static event banner (most visibly true for Community Calls,
// which reuse the same generic "T4P Monthly Community Call" graphic every
// month, but it applies to any event) — so prefer it whenever the recording
// or watch link resolves to a YouTube video, for every category, not just
// Community Calls. Falls back to the feed's own image when neither link is
// a YouTube URL (e.g. a Zoom link, or no recording yet).
//
// `fallback` is only set when `primary` is a YouTube thumbnail: the HD
// maxresdefault.jpg isn't guaranteed to exist, so callers (EventPreviewImage)
// need a second URL to drop down to.
export function previewImageSources(event: EventItem): PreviewImageSources {
  const sources =
    (event.recordingLink && youtubeThumbnailSources(event.recordingLink)) ||
    (event.watchLink && youtubeThumbnailSources(event.watchLink));
  if (sources) return sources;
  return { primary: event.image, fallback: null };
}

export interface UpcomingEvent {
  event: EventItem;
  sectionDef: EventSectionDef;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Merges every category into one soonest-first list for the page-level
// "Upcoming Events" zone, capped to a rolling window so a category with many
// recurring instances scheduled far out can't push the archive down the page.
export function getUpcomingEvents(
  events: EventItem[],
  windowDays: number,
  nowMs: number = Date.now()
): { items: UpcomingEvent[]; hasMore: boolean } {
  const windowEndMs = nowMs + windowDays * DAY_MS;
  const items: UpcomingEvent[] = [];
  let hasMore = false;

  for (const event of events) {
    const sectionDef = sectionForEvent(event);
    if (!sectionDef) continue;

    const eventTime = timeOf(event);
    if (eventTime < nowMs) continue;
    if (eventTime > windowEndMs) {
      hasMore = true;
      continue;
    }
    items.push({ event, sectionDef });
  }

  items.sort((a, b) => timeOf(a.event) - timeOf(b.event));

  return { items, hasMore };
}

export function groupIntoSections(events: EventItem[], nowMs: number = Date.now()): EventSection[] {
  const byKey = new Map<string, EventSection>();

  for (const event of events) {
    const def = sectionForEvent(event);
    if (!def) continue;
    if (!byKey.has(def.key)) byKey.set(def.key, { def, past: [] });

    const section = byKey.get(def.key)!;
    const eventTime = event.dateUtcIso ? new Date(event.dateUtcIso).getTime() : 0;
    // Upcoming events are surfaced separately via getUpcomingEvents(); this
    // grouping only feeds the past-events archive, so events that haven't
    // happened yet are simply skipped here.
    if (eventTime < nowMs) {
      section.past.push(event);
    }
  }

  // Most-recent-first.
  for (const section of byKey.values()) {
    section.past.sort((a, b) => timeOf(b) - timeOf(a));
  }

  const ordered = SECTION_DEFS.map((def) => byKey.get(def.key)).filter(
    (section): section is EventSection => Boolean(section)
  );

  return ordered;
}

function timeOf(event: EventItem): number {
  return event.dateUtcIso ? new Date(event.dateUtcIso).getTime() : 0;
}

// Mirrors the past/upcoming split used when building sections, for callers
// (e.g. a deep-linked event) that need to classify a single event on its own
// rather than via groupIntoSections/getUpcomingEvents.
export function isEventPast(event: EventItem, nowMs: number = Date.now()): boolean {
  return timeOf(event) < nowMs;
}
