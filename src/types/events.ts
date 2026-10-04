export interface EventItem {
  id: string;
  title: string;
  // `date` and `time` are wall clock in the *organizer's* zone (the DTSTART
  // TZID), not the visitor's — only safe to display for all-day events, which
  // have no instant. Everything else should render from `dateUtcIso`; see
  // useEventDate() in components/events/EventsShared.tsx.
  date: string; // "YYYY-MM-DD" in the organizer's zone
  status: string;
  location: string;
  locationLink: string; // map link for in-person events, "" otherwise
  watchLink: string; // online join/stream link (e.g. a YouTube channel), "" otherwise
  image: string;
  link: string;
  time?: string; // e.g. "7:30 PM" in the organizer's zone; absent for all-day events
  description?: string;
  registerLink?: string;
  recordingLink?: string;
  tags: string[];
  dateUtcIso: string | null; // instant used for upcoming/past comparisons; null if unresolvable
  endUtcIso: string | null; // event end instant; falls back to start + 1hr if DTEND is missing
}

export const DEFAULT_EVENT_IMAGE = "/images/default.jpg";

// Below this length a description is basically just a placeholder (e.g.
// "In this call we discuss T4P updates!") — not worth a popup of its own.
const MEANINGFUL_DESCRIPTION_MIN_LENGTH = 80;

export function hasMeaningfulDescription(event: EventItem): boolean {
  return (event.description?.trim().length ?? 0) >= MEANINGFUL_DESCRIPTION_MIN_LENGTH;
}

// The best single call-to-action link + label for an event, in priority
// order. Shared by both event pages' detail popups.
export function primaryEventLink(
  event: EventItem,
  isPast: boolean
): { link: string; label: string } {
  if (isPast) {
    // Registration is closed once an event is over — never offer it here,
    // even if the feed still has a registerLink set.
    if (event.recordingLink) return { link: event.recordingLink, label: "Watch recording" };
    if (event.watchLink) return { link: event.watchLink, label: "Watch online" };
    return { link: "", label: "" };
  }
  if (event.registerLink) return { link: event.registerLink, label: "Register" };
  if (event.watchLink) return { link: event.watchLink, label: "Watch online" };
  return { link: "", label: "" };
}
