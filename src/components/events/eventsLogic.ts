import {
  DEFAULT_EVENT_IMAGE,
  hasMeaningfulDescription,
  primaryEventLink,
  type EventItem,
} from "../../store/eventsClient";
import {
  formatSpeakerList,
  getDescriptionExcerpt,
  getEventSpeakers,
} from "../../utils/eventDescription";
import {
  isEventPast,
  previewImageSources,
  type EventSection,
  type UpcomingEvent,
} from "../../utils/eventSections";
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

/** Whether an event has a real preview (feed image or YouTube thumbnail), not the generic default. */
export function hasPreviewImage(event: EventItem): boolean {
  return previewImageSources(event).primary !== DEFAULT_EVENT_IMAGE;
}

/** Whether an upcoming event has anywhere to send someone yet (a popup or a link). */
export function isUpcomingConfirmed(event: EventItem): boolean {
  return hasMeaningfulDescription(event) || Boolean(primaryEventLink(event, false).link);
}

/**
 * Pulls the soonest confirmed event out of a soonest-first list for the "Next up"
 * spotlight. A placeholder never takes the spotlight; with none confirmed there
 * is no spotlight and every event stays a row.
 */
export function splitSpotlight(items: UpcomingEvent[]): {
  spotlight: UpcomingEvent | null;
  rest: UpcomingEvent[];
} {
  const index = items.findIndex((item) => isUpcomingConfirmed(item.event));
  if (index === -1) return { spotlight: null, rest: items };
  return { spotlight: items[index], rest: items.filter((_, i) => i !== index) };
}
