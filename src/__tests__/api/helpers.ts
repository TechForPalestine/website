/** Flatten a Response into plain data so tests can assert status, headers and body exactly. */
export async function snapshot(response: Response) {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const text = await response.text();
  let json: unknown = undefined;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON (pipe, OPTIONS)
  }
  return { status: response.status, headers, text, json };
}

export const ORIGIN = "https://techforpalestine.org";

export const JSON_ONLY = { "content-type": "application/json" };
export const JSON_ACAO = { ...JSON_ONLY, "access-control-allow-origin": ORIGIN };
export const JSON_CORS_POST_OPTIONS = {
  ...JSON_ONLY,
  "access-control-allow-origin": ORIGIN,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "Content-Type",
};
