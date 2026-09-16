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

// Opening an event modal always pushes its real /events/<slug> URL first
// (see eventSlug.ts + Events.tsx), so by the time the Share button is
// visible the address bar already is the shareable link.
export async function copyEventLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
