import { timingSafeEqual } from "node:crypto";

export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Compare byte lengths, not string lengths: "é" and "ee" have the same
  // .length but different UTF-8 sizes, and timingSafeEqual throws on a mismatch.
  if (aBytes.length !== bBytes.length) return false;
  return timingSafeEqual(aBytes, bBytes);
}

/** Verifies a hex-encoded HMAC-SHA256 of `body` (e.g. a webhook signature). */
export async function verifyHmacSha256Hex(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return constantTimeEqual(expected, signature);
}
