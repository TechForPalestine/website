/// <reference types="@cloudflare/workers-types" />
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  context.locals.cspNonce = nonce;

  const response = await next();

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' trusts scripts loaded by nonced scripts; removes need for 'unsafe-inline'
    `script-src 'nonce-${nonce}' 'strict-dynamic' https://secure.qgiv.com https://plausible.io https://pal-chat.net`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://plausible.io https://pal-chat.net",
    "frame-src https://secure.qgiv.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");

  // Inject nonce into every <script> tag so Astro's hydration scripts and
  // inline scripts are all covered by the nonce-based allowlist.
  const rewriter = new HTMLRewriter().on("script", {
    element(el) {
      el.setAttribute("nonce", nonce);
    },
  });

  const transformed = rewriter.transform(response);
  transformed.headers.set("Content-Security-Policy", csp);
  return transformed;
});
