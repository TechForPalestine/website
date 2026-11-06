// Restates a CET event time in the visitor's own time zone, so a global
// audience doesn't have to do the conversion. Pure so it runs under Vitest.

const REFERENCE_ZONE = "Europe/Paris";

function format(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}

/** e.g. "Fri, 2:30 PM EST"; null when the visitor's zone shows the same
 * wall-clock time as CET (nothing to add) or the inputs are unusable. */
export function localSessionTime(startsAt: string, timeZone: string): string | null {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const local = format(date, timeZone);
    const reference = format(date, REFERENCE_ZONE);
    // Compare without the zone name: Berlin says "GMT+1", Paris "GMT+1" too,
    // but only the wall-clock time matters to the reader.
    const strip = (s: string) => s.replace(/\s\S+$/, "");
    return strip(local) === strip(reference) ? null : local;
  } catch {
    return null;
  }
}
