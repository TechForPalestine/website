// Pure decision logic for the homepage Tech Rebellion promo modal
// (src/components/home/RebellionPopup.astro). Kept DOM-free so it runs under
// Vitest's node environment.

export const EVENT_URL = "https://techrebellion.techforpalestine.org/";
export const STORAGE_KEY = "t4p-tech-rebellion-2026-popup";
export const SHOW_DELAY_MS = 4_000;
// Event day in Berlin (CET, UTC+1) and the midnight after it.
export const EVENT_DAY = "2026-12-12";
export const CAMPAIGN_ENDS_AT = Date.parse("2026-12-13T00:00:00+01:00");
const EVENT_STARTS_AT = Date.parse(`${EVENT_DAY}T00:00:00+01:00`);
const DAY_MS = 86_400_000;
// Set on <html> and fired on window once the modal opens, so the newsletter
// popup (a separate React bundle) can stand down for this page load.
export const SHOWN_ATTRIBUTE = "data-rebellion-popup-shown";
export const SHOWN_EVENT = "t4p:rebellion-popup-shown";

export type PopupState = { dismissedAt: number } | null;
export type DismissReason = "close" | "escape" | "backdrop" | "cta";

export function isCampaignLive(now: number): boolean {
  return now < CAMPAIGN_ENDS_AT;
}

// Whole days until the event starts; 0 on the day itself (or once it has begun).
export function daysUntilEvent(now: number): number {
  return Math.max(0, Math.ceil((EVENT_STARTS_AT - now) / DAY_MS));
}

export function countdownLabel(now: number): string {
  const days = daysUntilEvent(now);
  if (days === 0) return "Happening today";
  return days === 1 ? "Tomorrow" : `${days} days to go`;
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
