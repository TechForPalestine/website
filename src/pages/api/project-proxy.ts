import type { APIRoute } from "astro";
import { getEnv } from "../../utils/getEnv.js";
import { reportAndFlush } from "../../lib/report-error";
import { buildForwardHeaders, normalizeProxyPath } from "../../utils/safeProxy";

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
const ALLOWED_PREFIX = "/api/method/";

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
  const normalizedPath = normalizeProxyPath(url.searchParams.get("path"), ALLOWED_PREFIX);

  if (!normalizedPath) {
    return new Response(JSON.stringify({ error: "Path not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = `${apiUrl.replace(/\/$/, "")}${normalizedPath}`;

  const headers = buildForwardHeaders(request.headers, secretKey);

  try {
    const init: RequestInit & { duplex: "half" } = {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      // Cloudflare Workers require this for streaming POST bodies
      duplex: "half",
    };
    const upstreamResponse = await fetch(upstream, init);

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("connection");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    reportAndFlush(error, { context: "project-proxy", path: normalizedPath }, locals);

    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET: APIRoute = ({ request, locals }) => proxy(request, locals);
export const POST: APIRoute = ({ request, locals }) => proxy(request, locals);
