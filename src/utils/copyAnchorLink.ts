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
