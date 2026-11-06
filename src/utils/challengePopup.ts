// Pure decision logic for the homepage November 2026 challenge popup
// (src/components/home/ChallengePopup.astro) and the brainstorm promo on
// /monthly-challenge. Kept DOM-free so it runs under Vitest's node environment.

import { brainstorm } from "../data/challenges/november-2026";

export const STORAGE_KEY = "t4p-challenge-2026-11-popup";
// The popup waits for engagement rather than greeting arrivals: it fires on
// whichever comes first. Both land before the newsletter popup (10s / 35%),
// which then stands down for the page load.
export const SHOW_DELAY_MS = 8_000;
export const SCROLL_TRIGGER_RATIO = 0.25;
// Midnight CET going into December.
export const CAMPAIGN_ENDS_AT = Date.parse("2026-12-01T00:00:00+01:00");
export const BRAINSTORM_ENDS_AT = Date.parse(brainstorm.endsAt);
// Set on <html> and fired on window once the popup opens, so the newsletter
// popup (a separate React bundle) can stand down for this page load.
export const SHOWN_ATTRIBUTE = "data-challenge-popup-shown";
export const SHOWN_EVENT = "t4p:challenge-popup-shown";

export type PopupState = { dismissedAt: number } | null;
export type PopupCta = "challenge" | "brainstorm" | "apply";
export type DismissReason = "close" | "escape" | "backdrop" | PopupCta;

export function isCampaignLive(now: number): boolean {
  return now < CAMPAIGN_ENDS_AT;
}

export function isBrainstormOpen(now: number): boolean {
  return now < BRAINSTORM_ENDS_AT;
}

export function hasReachedScrollTrigger(
  scrollY: number,
  viewportHeight: number,
  docHeight: number
): boolean {
  const scrollable = docHeight - viewportHeight;
  if (scrollable <= 0) return false;
  return scrollY / scrollable >= SCROLL_TRIGGER_RATIO;
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
    // Storage blocked or full: the popup still closes, it just won't be remembered.
  }
}

// Shown once ever: any stored dismissal hides it for the rest of the campaign.
export function shouldShowPopup(state: PopupState, now: number): boolean {
  return isCampaignLive(now) && state === null;
}
