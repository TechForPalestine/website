// Single clipboard path. Returns false (never throws) when the Clipboard API
// is unavailable or refused, e.g. an insecure context or a denied permission,
// so callers only show "Copied!" when it actually happened.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Updates the address bar to the section's hash (without adding a history
// entry) and copies the full shareable URL to the clipboard — the
// GitHub-style "copy link to this heading" pattern, so a category can be
// shared directly (e.g. "check out the Book Club section").
export async function copyAnchorLink(slug: string): Promise<boolean> {
  const url = `${window.location.origin}${window.location.pathname}#${slug}`;
  history.replaceState(null, "", `#${slug}`);
  return copyToClipboard(url);
}

// Opening an event modal always pushes its real /events/<slug> URL first
// (see eventSlug.ts + Events.tsx), so by the time the Share button is
// visible the address bar already is the shareable link.
export async function copyEventLink(): Promise<boolean> {
  return copyToClipboard(window.location.href);
}
