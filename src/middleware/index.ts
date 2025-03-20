import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  response.headers.set("Cache-Control", "public, max-age=600");

  return response;
});
