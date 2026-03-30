import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  // Only set default cache for pages; API routes set their own Cache-Control
  if (!response.headers.has("Cache-Control")) {
    response.headers.set("Cache-Control", "public, max-age=600");
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
});
