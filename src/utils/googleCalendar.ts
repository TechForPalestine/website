// Builds a Google Calendar "add event" link. No API key or account needed: the
// visitor lands on Google's prefilled event form and saves it themselves.

export interface CalendarEvent {
  title: string;
  /** ISO 8601 with an offset, e.g. 2026-11-28T09:00:00-05:00. */
  startsAt: string;
  endsAt: string;
  details: string;
}

/** 2026-11-28T14:00:00.000Z -> 20261128T140000Z, the format Google expects. */
function toCalendarStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarStamp(event.startsAt)}/${toCalendarStamp(event.endsAt)}`,
    details: event.details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
