interface CalendarEventInput {
  title: string;
  description?: string;
  location: string;
  dateUtcIso: string | null;
  endUtcIso: string | null;
  registerLink?: string;
  watchLink?: string;
}

// "2025-02-26T09:00:00.000Z" -> "20250226T090000Z"
function toGoogleCalendarUtc(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

// The on-site popup already has a dedicated "Register" CTA button, so the
// stripped description omits any "Register here: <url>" line the organizer
// wrote — but once someone adds the event to their own calendar, that popup
// is gone and the calendar entry becomes the only record they have. Make
// sure the link survives into the exported event's details.
function buildCalendarDescription(event: CalendarEventInput): string {
  const base = event.description?.trim() || "";
  const link = event.registerLink || event.watchLink;
  if (!link || base.includes(link)) return base;

  const linkLine = event.registerLink ? `Register: ${link}` : `Watch online: ${link}`;
  return base ? `${base}\n\n${linkLine}` : linkLine;
}

export function buildGoogleCalendarLink(event: CalendarEventInput): string | null {
  if (!event.dateUtcIso) return null;

  const start = toGoogleCalendarUtc(event.dateUtcIso);
  const end = toGoogleCalendarUtc(event.endUtcIso ?? event.dateUtcIso);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
  });
  const details = buildCalendarDescription(event);
  if (details) params.set("details", details);
  if (event.location) params.set("location", event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
