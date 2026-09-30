import { jsonError } from "./apiResponse";

export const ALLOWED_ORIGIN = "https://techforpalestine.org";

/**
 * Who may call a write route.
 *
 * `allowedSuffixes` are hostname suffixes and always match on a label
 * boundary: a suffix without a leading dot is normalised to have one, so
 * "pages.dev" and ".pages.dev" both accept "x.pages.dev" and both reject
 * "evilpages.dev" and the bare "pages.dev".
 */
export interface OriginPolicy {
  readonly allowedOrigins?: readonly string[];
  readonly allowedSuffixes?: readonly string[];
  readonly allowMissingOrigin?: boolean;
}

const withLeadingDot = (suffix: string) => (suffix.startsWith(".") ? suffix : `.${suffix}`);

export function isAllowedOrigin(
  origin: string | null,
  policy: OriginPolicy = {}
): origin is string {
  if (!origin) return policy.allowMissingOrigin ?? false;

  const allowedOrigins = policy.allowedOrigins ?? [ALLOWED_ORIGIN];
  if (allowedOrigins.includes(origin)) return true;

  if (!policy.allowedSuffixes?.length) return false;
  try {
    const hostname = new URL(origin).hostname;
    return policy.allowedSuffixes.some((suffix) => hostname.endsWith(withLeadingDot(suffix)));
  } catch {
    return false;
  }
}

export function corsHeaders(origin: string, methods = "POST, OPTIONS") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
  } as const;
}

/** Shared by /api/membership-complete and /api/donation-complete. */
export const PAYMENT_ORIGIN_POLICY: OriginPolicy = {
  allowedOrigins: [ALLOWED_ORIGIN, ...(import.meta.env.PROD ? [] : ["http://localhost:4321"])],
  allowedSuffixes: [".website-aun.pages.dev"],
};

/** The origin handed to a guarded handler: only nullable when the policy allows a missing one. */
export type GuardedOrigin<P extends OriginPolicy> = P extends { readonly allowMissingOrigin: true }
  ? string | null
  : string;

export interface OriginGuardOptions {
  /** Response for a rejected origin. Defaults to `403 {"error":"Forbidden"}` without CORS headers. */
  readonly forbidden?: () => Response;
}

/**
 * Wraps a route handler so it only runs for an allowed Origin. The check
 * happens before the handler, so the request body is never parsed for a
 * rejected origin. The default 403 carries no CORS headers on purpose.
 */
export function withOriginGuard<P extends OriginPolicy, C extends { request: Request }>(
  policy: P,
  handler: (context: C, origin: GuardedOrigin<P>) => Response | Promise<Response>,
  { forbidden = () => jsonError(403, "Forbidden") }: OriginGuardOptions = {}
): (context: C) => Promise<Response> {
  return async (context) => {
    const origin = context.request.headers.get("Origin");
    if (!isAllowedOrigin(origin, policy)) return forbidden();
    return handler(context, origin as GuardedOrigin<P>);
  };
}

/** CORS preflight handler: 403 (empty) for a rejected origin, otherwise 200 with CORS headers. */
export function makeOptionsHandler(policy: OriginPolicy) {
  return async ({ request }: { request: Request }): Promise<Response> => {
    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin, policy)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { status: 200, headers: corsHeaders(origin) });
  };
}
