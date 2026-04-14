import type { APIRoute } from "astro";
import { getEnv } from "../../utils/getEnv.js";

export const prerender = false;

/**
 * Server-side proxy for the external project management API.
 * Accepts a `path` query param (relative path, must start with /).
 * Adds the Authorization header server-side so SECRET_KEY never reaches
 * the browser bundle.
 *
 * GET  /api/project-proxy?path=/api/method/foo  → GET  {API_URL}/api/method/foo
 * POST /api/project-proxy?path=/api/method/foo  → POST {API_URL}/api/method/foo
 */
async function proxy(request: Request, locals: unknown): Promise<Response> {
  const apiUrl = getEnv("PUBLIC_API_URL", locals);
  const secretKey = getEnv("PUBLIC_SECRET_KEY", locals);

  if (!apiUrl || !secretKey) {
    return new Response(JSON.stringify({ error: "Proxy not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");

  // Normalise dot-segments (../, ./) before the prefix check so a crafted
  // path like /api/method/../../api/auth/admin cannot bypass the guard.
  const normalizedPath = path ? new URL(path, "http://localhost").pathname : null;

  if (!normalizedPath || !normalizedPath.startsWith("/api/method/")) {
    return new Response(JSON.stringify({ error: "Path not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = `${apiUrl.replace(/\/$/, "")}${normalizedPath}`;

  // Explicit allowlist — never forward cookies, IP headers, or other
  // browser-supplied headers that could influence upstream access controls.
  const FORWARD_HEADERS = ["content-type", "accept", "accept-language", "accept-encoding"];
  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const val = request.headers.get(name);
    if (val) headers.set(name, val);
  }
  headers.set("Authorization", secretKey);

  const upstreamResponse = await fetch(upstream, {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    // @ts-ignore — Cloudflare Workers require this for streaming POST bodies
    duplex: "half",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  // Remove hop-by-hop headers
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export const GET: APIRoute = ({ request, locals }) => proxy(request, locals);
export const POST: APIRoute = ({ request, locals }) => proxy(request, locals);
