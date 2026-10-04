// Pure decision logic for the homepage hackathon promo modal
// (src/components/home/HackathonPopup.astro). Kept DOM-free so it runs under
// Vitest's node environment. See docs/superpowers/specs/2026-10-04-hackathon-popup-design.md.

export const TICKET_URL = "https://secure.qgiv.com/for/eventstest/event/hackathon2026/";
export const STORAGE_KEY = "t4p-hackathon-2026-popup";
export const SHOW_DELAY_MS = 4_000;
// Midnight after the event, Barcelona time (CET: DST ends on Oct 25).
export const CAMPAIGN_ENDS_AT = Date.parse("2026-11-01T00:00:00+01:00");
// Set on <html> and fired on window once the modal opens, so the newsletter
// popup (a separate React bundle) can stand down for this page load.
export const SHOWN_ATTRIBUTE = "data-hackathon-popup-shown";
export const SHOWN_EVENT = "t4p:hackathon-popup-shown";

export type PopupState = { dismissedAt: number } | null;
export type DismissReason = "close" | "escape" | "backdrop" | "ticket";

export function isCampaignLive(now: number): boolean {
  return now < CAMPAIGN_ENDS_AT;
}

export function parsePopupState(raw: string | null): PopupState {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { dismissedAt } = value as Record<string, unknown>;
  return typeof dismissedAt === "number" && Number.isFinite(dismissedAt) ? { dismissedAt } : null;
}

export function readPopupState(storage: Pick<Storage, "getItem"> | null): PopupState {
  try {
    return parsePopupState(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writePopupState(
  storage: Pick<Storage, "setItem"> | null,
  state: { dismissedAt: number }
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: the modal still closes, it just won't be remembered.
  }
}

// Shown once ever: any stored dismissal hides it for good.
export function shouldShowPopup(state: PopupState, now: number): boolean {
  return isCampaignLive(now) && state === null;
}
