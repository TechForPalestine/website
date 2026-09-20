// Pure decision logic for caching the ProjectHub list, kept free of any
// Cloudflare API so it can be exercised without one. projectsClient.ts wires
// it to the Workers Cache API.
//
// Policy: an entry younger than FRESH_MS is served as-is. Older, and ProjectHub
// is asked again; if that fails, the last good copy is served instead, for up
// to MAX_STALE_MS. A bad result never replaces a good one.

export const FRESH_MS = 5 * 60 * 1000;
export const MAX_STALE_MS = 24 * 60 * 60 * 1000;

export type CacheSource = "hit" | "miss" | "stale";

export interface CachedEntry<T> {
  storedAt: number;
  data: T;
}

export interface CacheDeps<T> {
  now: () => number;
  readCache: () => Promise<CachedEntry<T> | null>;
  fetchFresh: () => Promise<T>;
  /** Fire-and-forget; the caller decides how to keep it alive (waitUntil). */
  writeCache: (entry: CachedEntry<T>) => void | Promise<void>;
  /** False for a result that must not overwrite a good entry, e.g. an empty list. */
  isCacheable: (data: T) => boolean;
  onServeStale?: (reason: unknown) => void;
}

export async function resolveWithCache<T>(
  deps: CacheDeps<T>
): Promise<{ data: T; source: CacheSource }> {
  // A broken cache must never break the page: treat a read failure as a miss.
  const cached = await deps.readCache().catch(() => null);
  const now = deps.now();
  const age = cached ? now - cached.storedAt : Infinity;

  if (cached && age < FRESH_MS) {
    return { data: cached.data, source: "hit" };
  }

  const staleUsable = cached !== null && age < MAX_STALE_MS;

  let data: T;
  try {
    data = await deps.fetchFresh();
  } catch (error) {
    if (staleUsable && cached) {
      deps.onServeStale?.(error);
      return { data: cached.data, source: "stale" };
    }
    throw error;
  }

  if (!deps.isCacheable(data)) {
    // An unexpected or empty answer is not evidence the projects are gone.
    if (staleUsable && cached) {
      deps.onServeStale?.(new Error("ProjectHub returned an empty or unexpected list"));
      return { data: cached.data, source: "stale" };
    }
    return { data, source: "miss" };
  }

  // Never let a failed write turn a good response into an error. The try/catch
  // covers a write that throws synchronously; the .catch() one that rejects.
  try {
    Promise.resolve(deps.writeCache({ storedAt: now, data })).catch(() => {});
  } catch {
    // ignored: the response is still good
  }
  return { data, source: "miss" };
}
