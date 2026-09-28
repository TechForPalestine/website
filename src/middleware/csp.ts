import { defineMiddleware } from "astro:middleware";
import { buildCspHeader, frameOptionsFor } from "./cspHeader";

// HTMLRewriter is a Cloudflare Workers global — not available in Node types
declare const HTMLRewriter: new () => {
  on(
    selector: string,
    handlers: { element(el: { setAttribute(name: string, value: string): void }): void }
  ): typeof HTMLRewriter.prototype;
  transform(response: Response): Response;
};

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
  // CSP would block all JS — skip it in dev.
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
      element(el: { setAttribute(name: string, value: string): void }) {
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
