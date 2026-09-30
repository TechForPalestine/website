/**
 * JSON response helpers for API routes.
 *
 * Header sets are deliberately explicit per call: some error responses (the
 * pre-check 403) must NOT carry CORS headers, so nothing is added implicitly.
 */

export type HeaderMap = Record<string, string>;

/** JSON body with `Content-Type: application/json` plus any extra headers. */
export function jsonResponse(body: unknown, status = 200, headers: HeaderMap = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export interface JsonErrorOptions {
  /** Body key holding the message. Routes differ: "error" (default) or "message". */
  readonly key?: "error" | "message";
  readonly headers?: HeaderMap;
}

/** `{ [key]: message }` error body. */
export function jsonError(
  status: number,
  message: string,
  { key = "error", headers = {} }: JsonErrorOptions = {}
): Response {
  return jsonResponse({ [key]: message }, status, headers);
}
