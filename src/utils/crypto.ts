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
