import { defineMiddleware } from "astro:middleware";

export const cacheControl = defineMiddleware(async (context, next) => {
  const response = await next();

  // Pages are `private`: the homepage hero photo A/B test (src/pages/index.astro,
  // src/lib/heroPhotoAssignment.ts) picks a variant per visitor, so a shared cache must not
  // store one visitor's variant and serve it to everyone. Browsers may still cache for
  // 10 minutes.

  const pathname = context.url.pathname;
  const isApi = pathname.startsWith("/api/");
  const isPrivate = pathname === "/admin" || pathname.startsWith("/admin/");
  const isGet = context.request.method === "GET";
  if (!response.headers.has("Cache-Control") || isApi || isPrivate || !isGet) {
    response.headers.set(
      "Cache-Control",
      !isGet || isApi || isPrivate ? "no-store" : "private, max-age=600"
    );
  }

  return response;
});
