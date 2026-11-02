import { GrowthBook, type FeatureApiResponse, type FeatureResult } from "@growthbook/growthbook";

// Server-side GrowthBook for flags read during SSR. The browser never sees the SDK or a
// visitor id, and nothing is written to cookies or storage: the payload lives in this
// isolate's memory and each evaluation gets an id the caller makes up per request.

const API_HOST = "https://cdn.growthbook.io";
// Flag edits in GrowthBook reach the site within this window.
const PAYLOAD_TTL_MS = 60_000;
// A slow CDN must not hold up the page; the caller falls back to its default.
const FETCH_TIMEOUT_MS = 1_000;

interface CachedPayload {
  clientKey: string;
  payload: FeatureApiResponse;
  fetchedAt: number;
}

let cached: CachedPayload | undefined;

export interface LoadPayloadOptions {
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/** The SDK payload for a client key, from memory when under a minute old. */
export async function loadFeaturePayload(
  clientKey: string,
  { fetchImpl = fetch, now = Date.now }: LoadPayloadOptions = {}
): Promise<FeatureApiResponse | undefined> {
  const existing = cached?.clientKey === clientKey ? cached : undefined;
  if (existing && now() - existing.fetchedAt < PAYLOAD_TTL_MS) return existing.payload;

  try {
    const response = await fetchImpl(`${API_HOST}/api/features/${clientKey}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`GrowthBook payload fetch failed: ${response.status}`);
    const payload = (await response.json()) as FeatureApiResponse;
    cached = { clientKey, payload, fetchedAt: now() };
    return payload;
  } catch (error) {
    console.error("GrowthBook payload unavailable", error);
    // A stale payload beats none: keep serving the last known flags until a fetch succeeds.
    return existing?.payload;
  }
}

/** Evaluates one flag for one id against an already loaded payload. */
export function evalServerFeature(
  payload: FeatureApiResponse,
  key: string,
  id: string
): FeatureResult<unknown> {
  const gb = new GrowthBook({ attributes: { id } });
  gb.initSync({ payload });
  const result = gb.evalFeature(key);
  gb.destroy();
  return result;
}

/** Test hook: forget the in-memory payload. */
export function resetPayloadCache(): void {
  cached = undefined;
}
