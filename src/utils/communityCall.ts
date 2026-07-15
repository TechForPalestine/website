import type { CommunityCall } from "../store/notionClient";

export type CommunityCallState = "upcoming" | "live" | "ended";

const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000; // 3h — see design doc for why not 90min
const ENDED_GRACE_MS = 7 * 24 * 60 * 60 * 1000; // how long an ended call still "counts"

export function callState(call: CommunityCall, now: Date): CommunityCallState {
  const start = new Date(call.startUtcIso).getTime();
  const nowMs = now.getTime();
  if (nowMs < start) return "upcoming";
  if (nowMs < start + LIVE_WINDOW_MS) return "live";
  return "ended";
}

// Picks the one call the page/banner is "about", in strict priority order:
//   1. a call currently live
//   2. the soonest upcoming call
//   3. the most recent call that ended within the last 7 days
//   4. null — nothing scheduled
// Without this order, "ended" and "none scheduled" can both be true at once
// right after a call ends with no next row created yet.
export function featuredCall(calls: CommunityCall[], now: Date): CommunityCall | null {
  const nowMs = now.getTime();

  const live = calls.find((call) => callState(call, now) === "live");
  if (live) return live;

  const upcoming = calls
    .filter((call) => callState(call, now) === "upcoming")
    .sort((a, b) => new Date(a.startUtcIso).getTime() - new Date(b.startUtcIso).getTime())[0];
  if (upcoming) return upcoming;

  const recentlyEnded = calls
    .filter((call) => {
      if (callState(call, now) !== "ended") return false;
      const endedAt = new Date(call.startUtcIso).getTime() + LIVE_WINDOW_MS;
      return nowMs - endedAt < ENDED_GRACE_MS;
    })
    .sort((a, b) => new Date(b.startUtcIso).getTime() - new Date(a.startUtcIso).getTime())[0];

  return recentlyEnded || null;
}
