/**
 * Pure helpers for the authenticated upstream proxy (api/project-proxy.ts).
 */

// Explicit allowlist: never forward cookies, IP headers, or other
// browser-supplied headers that could influence upstream access controls.
const FORWARD_HEADERS = ["content-type", "accept", "accept-language", "accept-encoding"] as const;

/**
 * Normalises dot-segments (../, ./) and returns the pathname only if it sits
 * under `allowedPrefix`, else null. A crafted /api/method/../../api/auth/admin
 * (or its %2e%2e / backslash forms) cannot bypass the guard.
 */
export function normalizeProxyPath(path: string | null, allowedPrefix: string): string | null {
  if (!path) return null;
  const normalized = new URL(path, "http://localhost").pathname;
  return normalized.startsWith(allowedPrefix) ? normalized : null;
}

/** Builds upstream headers from the allowlist and sets Authorization. */
export function buildForwardHeaders(incoming: Headers, authorization: string): Headers {
  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const val = incoming.get(name);
    if (val) headers.set(name, val);
  }
  headers.set("Authorization", authorization);
  return headers;
}
