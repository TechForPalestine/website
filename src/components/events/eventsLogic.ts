import type { EventItem } from "../../store/eventsClient";
import {
  formatSpeakerList,
  getDescriptionExcerpt,
  getEventSpeakers,
} from "../../utils/eventDescription";
import { isEventPast, type EventSection } from "../../utils/eventSections";
import { findEventBySlug } from "../../utils/eventSlug";
import type { SelectedEvent } from "./EventsShared";

const EVENTS_PATH_PREFIX = /^\/events\//;

/** The `<slug>` of an `/events/<slug>` pathname, or null for any other path. */
export function eventSlugFromPathname(pathname: string): string | null {
  const slug = pathname.replace(EVENTS_PATH_PREFIX, "");
  return slug === pathname ? null : slug;
}

/** The event (and its past/upcoming state) an `/events/<slug>` URL points at. */
export function resolveSelectedEvent(
  events: EventItem[],
  pathname: string,
  nowMs: number = Date.now()
): SelectedEvent | null {
  const slug = eventSlugFromPathname(pathname);
  if (slug === null) return null;
  const event = findEventBySlug(events, slug);
  return event ? { event, isPast: isEventPast(event, nowMs) } : null;
}

/** One-line teaser on an upcoming card: speakers if listed, else an excerpt. */
export function upcomingTeaser(description: string | undefined): string {
  if (!description) return "";
  const speakers = getEventSpeakers(description);
  return speakers.length > 0
    ? `Featuring ${formatSpeakerList(speakers)}`
    : getDescriptionExcerpt(description);
}

/** Zero-padded count shown next to the "Upcoming" heading. */
export function formatUpcomingCount(count: number): string {
  return String(count).padStart(2, "0");
}

export function hasPastEvents(sections: EventSection[]): boolean {
  return sections.some((section) => section.past.length > 0);
}
