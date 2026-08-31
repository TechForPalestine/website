// Updates the address bar to the section's hash (without adding a history
// entry) and copies the full shareable URL to the clipboard — the
// GitHub-style "copy link to this heading" pattern, so a category can be
// shared directly (e.g. "check out the Book Club section").
export async function copyAnchorLink(slug: string): Promise<boolean> {
  const url = `${window.location.origin}${window.location.pathname}#${slug}`;
  history.replaceState(null, "", `#${slug}`);

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

// Same pattern, but for a single event rather than a whole category: encodes
// the event's (ICS UID) id as a `?event=` query param so the URL round-trips
// through EventItem.id lookups elsewhere (see isEventPast/groupIntoSections
// callers reading this param back out on mount).
export async function copyEventLink(id: string): Promise<boolean> {
  const search = `?event=${encodeURIComponent(id)}`;
  const url = `${window.location.origin}${window.location.pathname}${search}`;
  history.replaceState(null, "", `${window.location.pathname}${search}`);

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

// Strips a `?event=` param left by copyEventLink (or a pasted deep link) once
// its modal is closed, so the URL doesn't keep pointing at an event that's no
// longer on screen.
export function clearEventLinkParam(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("event")) return;
  url.searchParams.delete("event");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
