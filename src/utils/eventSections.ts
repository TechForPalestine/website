import type { EventItem } from "../store/eventsClient";

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
  upcoming: EventItem[];
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
function sectionForEvent(event: EventItem): EventSectionDef | null {
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

export function groupIntoSections(events: EventItem[], nowMs: number = Date.now()): EventSection[] {
  const byKey = new Map<string, EventSection>();

  for (const event of events) {
    const def = sectionForEvent(event);
    if (!def) continue;
    if (!byKey.has(def.key)) byKey.set(def.key, { def, upcoming: [], past: [] });

    const section = byKey.get(def.key)!;
    const eventTime = event.dateUtcIso ? new Date(event.dateUtcIso).getTime() : 0;
    if (eventTime >= nowMs) {
      section.upcoming.push(event);
    } else {
      section.past.push(event);
    }
  }

  // Upcoming soonest-first, past most-recent-first.
  for (const section of byKey.values()) {
    section.upcoming.sort((a, b) => timeOf(a) - timeOf(b));
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
