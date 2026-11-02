import { defineMiddleware } from "astro:middleware";

export const cacheControl = defineMiddleware(async (context, next) => {
  const response = await next();

  const pathname = context.url.pathname;
  const isApi = pathname.startsWith("/api/");
  const isPrivate = pathname === "/admin" || pathname.startsWith("/admin/");
  const isGet = context.request.method === "GET";
  if (!response.headers.has("Cache-Control") || isApi || isPrivate || !isGet) {
    response.headers.set(
      "Cache-Control",
      !isGet || isApi || isPrivate ? "no-store" : "public, max-age=600"
    );
  }

  return response;
});
