// Pure decision logic for the homepage newsletter popup
// (src/components/home/NewsletterPopup.tsx) and the iframe page it embeds
// (src/pages/newsletter-embed.astro). Kept DOM-free so it runs under Vitest's
// node environment. See docs/superpowers/specs/2026-09-23-newsletter-popup-design.md.

export const POPUP_FLAG = "homepage-newsletter-popup";
export const POPUP_STORAGE_KEY = "t4p-newsletter-popup";
export const SHOW_DELAY_MS = 10_000;
export const SCROLL_TRIGGER_RATIO = 0.35;
export const DISMISS_SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000;
export const EMBED_PATH = "/newsletter-embed";
export const EMBED_MESSAGE_SOURCE = "t4p-newsletter-embed";
export const MAX_EMBED_HEIGHT = 1200;
export const FOOTER_SECTION_ID = "mailing-list";
export const DESKTOP_QUERY = "(min-width: 768px)";
// Fired on window when the bottom-of-page ("footer") mailing-list form
// completes a signup, so a mounted popup (already read storage once at
// mount) can stand itself down on the current page load too.
export const POPUP_SUBSCRIBED_EVENT = "t4p:newsletter-subscribed";

export type PopupState = { dismissedAt: number } | { subscribed: true } | null;
export type EmbedMessage = { type: "resize"; height: number } | { type: "success" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePopupState(raw: string | null): PopupState {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  if (value.subscribed === true) return { subscribed: true };
  if (typeof value.dismissedAt === "number" && Number.isFinite(value.dismissedAt)) {
    return { dismissedAt: value.dismissedAt };
  }
  return null;
}

export function readPopupState(storage: Pick<Storage, "getItem"> | null): PopupState {
  try {
    return parsePopupState(storage?.getItem(POPUP_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writePopupState(
  storage: Pick<Storage, "setItem"> | null,
  state: Exclude<PopupState, null>
): void {
  try {
    storage?.setItem(POPUP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: the popup still closes, it just won't be remembered.
  }
}

// Reading window.localStorage itself throws a SecurityError when site data is blocked.
export function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isSuppressed(state: PopupState, now: number): boolean {
  if (state === null) return false;
  if ("subscribed" in state) return true;
  const age = now - state.dismissedAt;
  // A future timestamp means the clock was wrong when it was written; don't let
  // it hide the popup for years.
  return age >= 0 && age < DISMISS_SUPPRESS_MS;
}

export function hasReachedScrollTrigger(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number
): boolean {
  const scrollable = documentHeight - viewportHeight;
  if (scrollable <= 0) return false;
  return scrollY / scrollable >= SCROLL_TRIGGER_RATIO;
}

export function parseEmbedMessage(data: unknown): EmbedMessage | null {
  if (!isRecord(data) || data.source !== EMBED_MESSAGE_SOURCE) return null;
  if (data.type === "success") return { type: "success" };
  if (data.type === "resize" && typeof data.height === "number" && Number.isFinite(data.height)) {
    if (data.height <= 0) return null;
    return { type: "resize", height: Math.min(Math.ceil(data.height), MAX_EMBED_HEIGHT) };
  }
  return null;
}

export function toEmbedPayload(message: EmbedMessage): EmbedMessage & { source: string } {
  return { source: EMBED_MESSAGE_SOURCE, ...message };
}
