import { defineMiddleware } from "astro:middleware";

// Cloudflare doesn't apply public/_headers to Pages Functions responses, and
// nearly every route here is SSR, so these are set per request. _headers stays
// for static assets. Framing headers live in csp.ts (they vary per path).
export const securityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
});
