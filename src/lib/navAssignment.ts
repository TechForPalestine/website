import { getEnv } from "../utils/getEnv";
import {
  NAV_LABEL_EXPERIMENT,
  type NavLabelVariant,
  variantFromFeature,
} from "../utils/navLabelExperiment";
import { evalServerFeature, loadFeaturePayload } from "./growthbookServer";

// A/B test id that is stable for one visitor for one UTC day, without storing anything on
// the visitor's device. Same idea as Plausible's own visitor id: a keyed hash of the date,
// the IP and the User-Agent. The IP and User-Agent are only read here, in memory, and are
// never stored or sent anywhere; the hash itself never leaves the server either (GrowthBook
// evaluates it in-process, see src/lib/growthbookServer.ts).
//
// The date is part of the hash input, so the id rotates daily with no stored salt. Without
// the secret, or without an IP (pnpm dev), the caller falls back to a per-request id.

export const ASSIGNMENT_SECRET_ENV = "NAV_ASSIGNMENT_SECRET";

const IPV6_PREFIX_GROUPS = 4;

/** Expands an IPv6 address and keeps its /64 prefix, so privacy-extension address
 * rotation within one network does not re-roll the visitor. IPv4 is returned as is. */
export function normalizeIp(ip: string): string {
  const trimmed = ip.trim().toLowerCase();
  if (!trimmed.includes(":")) return trimmed;

  const [head, tail = ""] = trimmed.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = trimmed.includes("::") ? 8 - headGroups.length - tailGroups.length : 0;
  const groups = [...headGroups, ...Array<string>(Math.max(missing, 0)).fill("0"), ...tailGroups];
  return groups
    .slice(0, IPV6_PREFIX_GROUPS)
    .map((group) => group.replace(/^0+(?=.)/, ""))
    .join(":");
}

export interface AssignmentInput {
  secret: string;
  ip: string;
  userAgent: string;
  date: Date;
}

/** Hex HMAC-SHA-256 of `utcDate|ip|userAgent` keyed with the secret. */
export async function computeAssignmentId({
  secret,
  ip,
  userAgent,
  date,
}: AssignmentInput): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const day = date.toISOString().slice(0, 10);
  const message = `${day}|${normalizeIp(ip)}|${userAgent}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

let warnedMissingSecret = false;

/** The visitor's assignment id for this request: stable for the day when possible,
 * otherwise a throwaway per-request id. */
export async function requestAssignmentId(
  request: Request,
  locals: unknown,
  now: () => Date = () => new Date()
): Promise<string> {
  const secret = getEnv(ASSIGNMENT_SECRET_ENV, locals);
  const ip = request.headers.get("cf-connecting-ip");
  if (!secret || !ip) {
    if (!secret && ip && !warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn(
        `${ASSIGNMENT_SECRET_ENV} is not set: A/B test variants are re-picked on every request`
      );
    }
    return crypto.randomUUID();
  }
  return computeAssignmentId({
    secret,
    ip,
    userAgent: request.headers.get("user-agent") ?? "",
    date: now(),
  });
}

/** The nav label variant GrowthBook assigns this visitor, or null when they are not in the
 * test (flag off, CDN down). Navigation.astro and /api/membership-complete both call this,
 * so the server-side membership event gets the same variant the visitor was shown. */
export async function assignNavLabelVariant(
  request: Request,
  locals: unknown
): Promise<NavLabelVariant | null> {
  const clientKey = getEnv("PUBLIC_GROWTHBOOK_CLIENT_KEY", locals);
  const payload = clientKey ? await loadFeaturePayload(clientKey) : undefined;
  if (!payload) return null;
  const id = await requestAssignmentId(request, locals);
  return variantFromFeature(evalServerFeature(payload, NAV_LABEL_EXPERIMENT, id));
}
