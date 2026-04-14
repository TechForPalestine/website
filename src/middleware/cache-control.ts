import { defineMiddleware } from "astro:middleware";

export const cacheControl = defineMiddleware(async (context, next) => {
  const response = await next();

  const isApi = context.url.pathname.startsWith("/api/");
  const isGet = context.request.method === "GET";
  response.headers.set("Cache-Control", !isGet || isApi ? "no-store" : "public, max-age=600");

  return response;
});
