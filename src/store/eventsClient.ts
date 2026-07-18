import { getEnv } from "../utils/getEnv";
import { resolveIcsDateTimeToUtcIso } from "../utils/icalDate";
import { reportError } from "../lib/report-error";

export interface EventItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD", local wall-clock date from the feed
  status: string;
  location: string;
  locationLink: string; // map link for in-person events, "" otherwise
  watchLink: string; // online join/stream link (e.g. a YouTube channel), "" otherwise
  image: string;
  link: string;
  time?: string;
  description?: string;
  registerLink?: string;
  recordingLink?: string;
  tags: string[];
  dateUtcIso: string | null; // instant used for upcoming/past comparisons; null if unresolvable
  endUtcIso: string | null; // event end instant; falls back to start + 1hr if DTEND is missing
}

const REGISTRATION_HOSTS = ["zoom.us", "docs.google.com", "streamyard.com"];
const MAP_HOSTS = ["openstreetmap.org", "maps.google.com", "goo.gl"];

const DROPPED_TAGS = new Set(["testing"]);

interface RawProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

// ICS folds long lines: a continuation line starts with a single space or tab
// and must be joined to the previous line (with the leading whitespace stripped).
function unfoldLines(raw: string): string[] {
  const lines = raw.split(/\r\n|\n|\r/);
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else if (line.length > 0) {
      unfolded.push(line);
    }
  }
  return unfolded;
}

// Splits "NAME;PARAM=VAL;PARAM2=VAL2:value:with:colons" into name/params/value.
// The delimiter between the property head and its value is the first colon
// that isn't inside a double-quoted parameter value.
function parsePropertyLine(line: string): RawProperty | null {
  let inQuotes = false;
  let colonIndex = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === ":" && !inQuotes) {
      colonIndex = i;
      break;
    }
  }
  if (colonIndex === -1) return null;

  const head = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);
  const [name, ...paramParts] = head.split(";");

  const params: Record<string, string> = {};
  for (const part of paramParts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).toUpperCase();
    const val = part.slice(eqIndex + 1).replace(/^"|"$/g, "");
    params[key] = val;
  }

  return { name: name.toUpperCase(), params, value };
}

function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// The feed appends an "Organizer: <username>\nTags: ...\nRecording: ...\nBanner: ..."
// metadata block to every description, sometimes with no blank line before it
// (some events have no other body text at all, so it's the very first line) —
// match per-line rather than relying on a fixed "\n\nOrganizer:" prefix so the
// internal username never leaks into what's shown publicly.
function stripDescriptionMetadata(description: string): string {
  const lines = description.split("\n");
  const organizerIndex = lines.findIndex((line) => /^Organizer:/i.test(line.trim()));
  const kept = organizerIndex === -1 ? lines : lines.slice(0, organizerIndex);
  return kept.join("\n").trim();
}

// Organizers often write a "Register here: <url>" (sometimes with the URL on
// its own following line) directly in the description body, duplicating the
// same URL already surfaced as the structured registerLink/CTA button —
// strip it out so it doesn't show twice in the popup.
const REGISTER_LABEL_RE = /^(register|rsvp|sign\s*up)(\s+here)?:?\s*(https?:\/\/\S+)?\s*$/i;
const BARE_URL_LINE_RE = /^https?:\/\/\S+$/i;

function stripInlineRegistrationLines(description: string): string {
  const lines = description.split("\n");
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!REGISTER_LABEL_RE.test(line)) {
      kept.push(lines[i]);
      continue;
    }
    // Label-only line ("Register here:") with the URL on the next line —
    // consume that line too.
    const hasInlineUrl = /https?:\/\//i.test(line);
    if (!hasInlineUrl && i + 1 < lines.length && BARE_URL_LINE_RE.test(lines[i + 1].trim())) {
      i++;
    }
  }

  return kept.join("\n");
}

function extractImage(properties: RawProperty[]): string {
  const image = properties.find((p) => p.name === "IMAGE");
  if (image?.value) return image.value;
  const attach = properties.find((p) => p.name === "ATTACH");
  if (attach?.value) return attach.value;
  return "/images/default.jpg";
}

function matchesHost(url: string, hosts: string[]): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function resolveLinks(properties: RawProperty[]): {
  registerLink: string;
  locationLink: string;
  watchLink: string;
} {
  const registrationProp = properties.find((p) => p.name === "X-REGISTRATION-URL");
  if (registrationProp?.value) {
    return { registerLink: registrationProp.value, locationLink: "", watchLink: "" };
  }

  const urlValue = properties.find((p) => p.name === "URL")?.value || "";
  if (!urlValue) return { registerLink: "", locationLink: "", watchLink: "" };

  if (matchesHost(urlValue, REGISTRATION_HOSTS)) {
    return { registerLink: urlValue, locationLink: "", watchLink: "" };
  }
  if (matchesHost(urlValue, MAP_HOSTS)) {
    return { registerLink: "", locationLink: urlValue, watchLink: "" };
  }

  // Not a registration link or a map pin — this is almost always an online
  // event's join/watch link (e.g. a YouTube channel), not a physical
  // location, even though the feed reuses LOCATION/URL for it.
  return { registerLink: "", locationLink: "", watchLink: urlValue };
}

function formatLocalTime(timePart: string): string {
  const hour = Number(timePart.slice(0, 2));
  const minute = timePart.slice(2, 4);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function parseVEvent(block: string[]): EventItem | null {
  const properties: RawProperty[] = [];
  for (const line of block) {
    const parsed = parsePropertyLine(line);
    if (parsed) properties.push(parsed);
  }

  const get = (name: string) => properties.find((p) => p.name === name);

  const uid = get("UID")?.value;
  const summary = get("SUMMARY")?.value;
  const dtstart = get("DTSTART");
  if (!uid || !summary || !dtstart) return null;

  const title = unescapeIcsText(summary);

  const tzid = dtstart.params["TZID"];
  const isAllDay = !dtstart.value.includes("T");
  let date = "";
  let time: string | undefined;
  if (!isAllDay) {
    const [rawDate, rawTime] = dtstart.value.replace("Z", "").split("T");
    date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    time = formatLocalTime(rawTime);
  } else {
    date = `${dtstart.value.slice(0, 4)}-${dtstart.value.slice(4, 6)}-${dtstart.value.slice(6, 8)}`;
  }

  const dateUtcIso = resolveIcsDateTimeToUtcIso(dtstart.value, tzid);

  const dtend = get("DTEND");
  const endUtcIso = dtend
    ? resolveIcsDateTimeToUtcIso(dtend.value, dtend.params["TZID"])
    : dateUtcIso
      ? new Date(new Date(dateUtcIso).getTime() + 60 * 60 * 1000).toISOString()
      : null;

  const rawLocation = get("LOCATION")?.value || "";
  const location = unescapeIcsText(isUrl(rawLocation) ? "" : rawLocation);

  const rawDescription = get("DESCRIPTION")?.value || "";
  const description = stripDescriptionMetadata(
    stripInlineRegistrationLines(unescapeIcsText(rawDescription))
  );

  const categories = get("CATEGORIES")?.value || "";
  const tags = categories
    .split(",")
    .map((t) => unescapeIcsText(t).trim().toLowerCase())
    .filter(Boolean);

  const recordingLink = get("X-RECORDING-URL")?.value || "";
  const image = extractImage(properties);
  const { registerLink, locationLink, watchLink } = resolveLinks(properties);
  const status = get("STATUS")?.value || "";

  return {
    id: uid,
    title,
    date,
    status,
    location,
    locationLink,
    watchLink,
    image,
    link: registerLink || recordingLink || "",
    time,
    description,
    registerLink,
    recordingLink,
    tags,
    dateUtcIso,
    endUtcIso,
  };
}

function parseIcsCalendar(raw: string): EventItem[] {
  const lines = unfoldLines(raw);
  const parsed: { event: EventItem; isOverride: boolean }[] = [];
  let currentBlock: string[] | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentBlock = [];
      continue;
    }
    if (line === "END:VEVENT") {
      if (currentBlock) {
        const event = parseVEvent(currentBlock);
        if (event && !event.tags.some((t) => DROPPED_TAGS.has(t))) {
          const isOverride = currentBlock.some((l) => l.startsWith("RECURRENCE-ID"));
          parsed.push({ event, isOverride });
        }
      }
      currentBlock = null;
      continue;
    }
    if (currentBlock) currentBlock.push(line);
  }

  // The feed sometimes includes both a recurring master VEVENT and an
  // explicit RECURRENCE-ID override for that same occurrence (e.g. the
  // master's own first instance) — dedupe by (uid, start instant),
  // preferring the override since it carries any edits for that date.
  const byOccurrence = new Map<string, { event: EventItem; isOverride: boolean }>();
  for (const entry of parsed) {
    const key = `${entry.event.id}|${entry.event.dateUtcIso}`;
    const existing = byOccurrence.get(key);
    if (!existing || (entry.isOverride && !existing.isOverride)) {
      byOccurrence.set(key, entry);
    }
  }

  return dedupeCommunityCallDuplicates(Array.from(byOccurrence.values()).map((entry) => entry.event));
}

const COMMUNITY_CALL_TITLE_RE = /^(t4p\s+)?(monthly\s+)?community\s+(monthly\s+)?call/i;

function isCommunityCallTitle(title: string): boolean {
  return COMMUNITY_CALL_TITLE_RE.test(title.trim());
}

function eventRichness(event: EventItem): number {
  let score = 0;
  if (event.tags.length > 0) score++;
  if (event.recordingLink) score++;
  if (event.description) score++;
  if (event.image !== "/images/default.jpg") score++;
  return score;
}

// The source calendar sometimes carries a bare recurring placeholder
// ("Community monthly call", almost no content) alongside a separate,
// richer one-off event for the same month ("Community monthly call July
// 2025") — same calendar day, different time. Keep only the richer one.
function dedupeCommunityCallDuplicates(events: EventItem[]): EventItem[] {
  const byDay = new Map<string, EventItem>();
  const rest: EventItem[] = [];

  for (const event of events) {
    if (!isCommunityCallTitle(event.title)) {
      rest.push(event);
      continue;
    }
    const existing = byDay.get(event.date);
    if (!existing || eventRichness(event) > eventRichness(existing)) {
      byDay.set(event.date, event);
    }
  }

  return [...rest, ...byDay.values()];
}

// The best single call-to-action link + label for an event, in priority
// order. Shared by both event pages' detail popups.
// Below this length a description is basically just a placeholder (e.g.
// "In this call we discuss T4P updates!") — not worth a popup of its own.
const MEANINGFUL_DESCRIPTION_MIN_LENGTH = 80;

export function hasMeaningfulDescription(event: EventItem): boolean {
  return (event.description?.trim().length ?? 0) >= MEANINGFUL_DESCRIPTION_MIN_LENGTH;
}

export function primaryEventLink(event: EventItem, isPast: boolean): { link: string; label: string } {
  if (isPast) {
    // Registration is closed once an event is over — never offer it here,
    // even if the feed still has a registerLink set.
    if (event.recordingLink) return { link: event.recordingLink, label: "Watch recording" };
    if (event.watchLink) return { link: event.watchLink, label: "Watch online" };
    return { link: "", label: "" };
  }
  if (event.registerLink) return { link: event.registerLink, label: "Register" };
  if (event.watchLink) return { link: event.watchLink, label: "Watch online" };
  if (event.recordingLink) return { link: event.recordingLink, label: "Watch recording" };
  return { link: "", label: "" };
}

export async function fetchEvents(locals?: any): Promise<EventItem[]> {
  const icsUrl = getEnv("EVENTS_ICS_URL", locals);

  if (!icsUrl) {
    throw new Error("Missing events feed configuration: EVENTS_ICS_URL is required");
  }

  try {
    const response = await fetch(icsUrl);
    if (!response.ok) {
      throw new Error(`Events feed request failed with status ${response.status}`);
    }
    const raw = await response.text();
    const events = parseIcsCalendar(raw);

    return events.sort((a, b) => {
      const aTime = a.dateUtcIso ? new Date(a.dateUtcIso).getTime() : 0;
      const bTime = b.dateUtcIso ? new Date(b.dateUtcIso).getTime() : 0;
      return bTime - aTime;
    });
  } catch (error) {
    reportError(error, { context: "events-ics-fetch" });
    throw new Error("Failed to fetch events");
  }
}
