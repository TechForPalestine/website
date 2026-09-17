import type { EventItem } from "../store/eventsClient";
import { displayTitle } from "./eventSections";
import { slugify } from "./slugify";

// Isomorphic (no Node-only APIs) — used from both Astro frontmatter (server)
// and React (client) so the two never drift apart on what a shareable event
// URL looks like.

// ICS UIDs look like "<uuid>@events.t4p" — an RFC 5545 UID is
// "<local-part>@<domain>", and the local part alone is already the globally
// unique bit (other places in the codebase, e.g. the banner image URL,
// already key off just this part). Drop the "@..." suffix so the shareable
// URL doesn't carry it.
function bareId(id: string): string {
  return id.split("@")[0];
}

// Redundant in a URL on techforpalestine.org itself — most event titles
// start with it (e.g. "Tech for Palestine Roundtable: ..."), which just
// pads out the slug without adding information.
const BRAND_PREFIX = /^tech-for-palestine-/;

function slugTitle(event: EventItem): string {
  const slug = slugify(displayTitle(event));
  const stripped = slug.replace(BRAND_PREFIX, "");
  return stripped || slug;
}

export function eventSlug(event: EventItem): string {
  return `${slugTitle(event)}-${bareId(event.id)}`;
}

export function eventPath(event: EventItem): string {
  return `/events/${eventSlug(event)}`;
}

export function findEventBySlug(events: EventItem[], slug: string): EventItem | undefined {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // malformed percent-encoding — fall through and just fail to match below
  }
  return events.find((event) => eventSlug(event) === decoded);
}
