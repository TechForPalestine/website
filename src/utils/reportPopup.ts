// Pure decision logic for the homepage Wikipedia report popup. It must never
// collide with the November challenge popup (challengePopup.ts), so it reads
// the challenge's dismissal state and stands aside for it. Kept DOM-free so it
// runs under Vitest's node environment.

import { type PopupState, isCampaignLive, parsePopupState } from "./challengePopup";

export const STORAGE_KEY = "t4p-wikipedia-report-popup";
// Once the challenge popup has been dismissed, wait this long before the report
// popup may appear, so the two never land on the same visit back to back.
export const REPORT_AFTER_CHALLENGE_GAP_MS = 12 * 60 * 60 * 1000;
// Set on <html> and fired on window once the report popup opens, mirroring the
// challenge popup's signal so other popups can stand down for this page load.
export const REPORT_SHOWN_ATTRIBUTE = "data-report-popup-shown";
export const REPORT_SHOWN_EVENT = "t4p:report-popup-shown";

export type ReportPopupCta = "read" | "pdf";
export type ReportDismissReason = "close" | "escape" | "backdrop" | ReportPopupCta;

export function isReportPopupLive(): boolean {
  return true;
}

export function readReportPopupState(storage: Pick<Storage, "getItem"> | null): PopupState {
  try {
    return parsePopupState(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writeReportPopupState(
  storage: Pick<Storage, "setItem"> | null,
  state: { dismissedAt: number }
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: the popup still closes, it just won't be remembered.
  }
}

export function shouldShowReportPopup(args: {
  report: PopupState;
  challenge: PopupState;
  now: number;
}): boolean {
  const { report, challenge, now } = args;
  if (!isReportPopupLive()) return false;
  if (report !== null) return false;
  if (isCampaignLive(now) && challenge === null) return false;
  if (challenge && now - challenge.dismissedAt < REPORT_AFTER_CHALLENGE_GAP_MS) return false;
  return true;
}
