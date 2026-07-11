export const ALLOWED_ORIGIN = "https://techforpalestine.org";

export interface OriginPolicy {
  readonly allowedOrigins?: readonly string[];
  readonly allowedSuffixes?: readonly string[];
  readonly allowMissingOrigin?: boolean;
}

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
    return policy.allowedSuffixes.some((suffix) => hostname.endsWith(suffix));
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
