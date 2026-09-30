import { defineMiddleware } from "astro:middleware";
import { buildCspHeader, frameOptionsFor } from "./cspHeader";

export const csp = defineMiddleware(async (context, next) => {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  context.locals.cspNonce = nonce;

  const response = await next();

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const cspHeader = buildCspHeader(nonce, context.url.pathname);

  // HTMLRewriter is only available in Cloudflare Workers (not Node/dev).
  // Without it we can't inject nonces into scripts, so enforcing a nonce-based
  // CSP would block all JS — skip it in dev. Consequence: `astro dev` sends NO
  // CSP, so violations only show up on a Cloudflare preview/production build.
  // (HTMLRewriter is declared globally in src/env.d.ts.)
  if (typeof HTMLRewriter === "undefined") {
    return response;
  }

  // Inject nonce into every <script> and <style> tag so Astro's hydration
  // scripts and any server-rendered inline styles are covered by the nonce.
  const rewriter = new HTMLRewriter()
    .on("script", {
      element(el) {
        el.setAttribute("nonce", nonce);
      },
    })
    .on("style", {
      element(el) {
        el.setAttribute("nonce", nonce);
      },
    });

  const transformed = rewriter.transform(response);
  transformed.headers.set("Content-Security-Policy", cspHeader);
  // Set here, not in public/_headers: Cloudflare doesn't apply _headers to
  // Pages Functions responses, and every HTML page on this site is SSR.
  transformed.headers.set("X-Frame-Options", frameOptionsFor(context.url.pathname));
  return transformed;
});
