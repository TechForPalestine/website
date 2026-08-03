// Resolves an iCalendar-style local date/time + IANA time zone to a UTC ISO string.
//
// Two call shapes need this:
//   - Notion date properties with a `time_zone` override (no offset in `start`)
//   - ICS `DTSTART;TZID=...` lines (no offset in the value, zone given separately)
//
// Standard offset-discovery trick: guess the instant is UTC, ask the target time
// zone what wall-clock time that instant shows, then correct by the difference.
// Handles arbitrary IANA zones with no dependency.
export function resolveLocalDateTimeToUtcIso(
  datePart: string,
  timePart: string,
  timeZone: string
): string | null {
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, secondMs] = timePart.split(":");
  const second = Number((secondMs || "0").split(".")[0]);

  const guessUtc = Date.UTC(year, month - 1, day, Number(hour), Number(minute), second);

  let formatted: Intl.DateTimeFormatPart[];
  try {
    formatted = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(guessUtc));
  } catch {
    return null;
  }

  const part = (type: string) => formatted.find((p) => p.type === type)?.value;
  const asIfUtc = Date.UTC(
    Number(part("year")),
    Number(part("month")) - 1,
    Number(part("day")),
    Number(part("hour")),
    Number(part("minute")),
    Number(part("second"))
  );

  return new Date(guessUtc - (asIfUtc - guessUtc)).toISOString();
}

interface NotionDateProperty {
  date?: { start: string; time_zone?: string | null } | null;
}

// Notion returns `start` two different ways depending on whether the date
// property has an explicit time zone override:
//   - no override: the UTC offset is embedded in `start` itself, e.g.
//     "2026-07-22T17:00:00.000-04:00" — Date.parse handles this correctly.
//   - override set: `start` has NO offset ("2026-07-22T17:00:00.000") and
//     the zone lives separately in `time_zone`. Parsing that string with
//     `new Date()` would use the *server's* zone, not the call's — wrong
//     for every visitor outside that zone. Resolve it explicitly instead.
export function resolveDateToUtcIso(prop: NotionDateProperty | undefined): string | null {
  const start = prop?.date?.start;
  if (!start) return null;

  // Date-only rows ("2026-07-22", no time component) can't anchor a live
  // window — reject rather than silently defaulting to UTC midnight.
  if (!start.includes("T")) return null;

  const timeZone = prop?.date?.time_zone;
  if (!timeZone) {
    const parsed = new Date(start);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const [datePart, timePart] = start.split("T");
  return resolveLocalDateTimeToUtcIso(datePart, timePart, timeZone);
}

// ICS DTSTART value shapes:
//   - "DTSTART;TZID=Europe/Prague:20250226T090000" -> datePart="20250226T090000", tzid="Europe/Prague"
//   - "DTSTART;VALUE=DATE:20250226" -> all-day, no time component
//   - "DTSTART:20250226T090000Z" -> already UTC
export function resolveIcsDateTimeToUtcIso(value: string, tzid?: string): string | null {
  const isAllDay = !value.includes("T");
  if (isAllDay) return null;

  if (value.endsWith("Z")) {
    const raw = value.slice(0, -1);
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));
    const hour = Number(raw.slice(9, 11));
    const minute = Number(raw.slice(11, 13));
    const second = Number(raw.slice(13, 15) || "0");
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }

  const [rawDate, rawTime] = value.split("T");
  const datePart = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  const timePart = `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}:${rawTime.slice(4, 6) || "00"}`;

  if (!tzid) {
    const parsed = new Date(`${datePart}T${timePart}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return resolveLocalDateTimeToUtcIso(datePart, timePart, tzid);
}
