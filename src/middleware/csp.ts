import { defineMiddleware } from "astro:middleware";

// HTMLRewriter is a Cloudflare Workers global — not available in Node types
declare const HTMLRewriter: new () => {
  on(selector: string, handlers: { element(el: { setAttribute(name: string, value: string): void }): void }): typeof HTMLRewriter.prototype;
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

  const cspHeader = [
    "default-src 'self'",
    // 'strict-dynamic' trusts scripts loaded by nonced scripts; removes need for 'unsafe-inline'
    `script-src 'nonce-${nonce}' 'strict-dynamic' https://secure.qgiv.com https://plausible.io https://pal-chat.net https://techforpalestine.org/cdn-cgi/ https://eomail4.com https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://prod-donation-elements-b-donationelementsjsfilesb-1m4f4dl6p6b21.s3.us-east-2.amazonaws.com`,
    `style-src 'nonce-${nonce}' 'self' https://fonts.googleapis.com https://secure.qgiv.com`,
    "font-src 'self' https://fonts.gstatic.com https://gallery.eo.page",
    "img-src 'self' data: https:",
    "connect-src 'self' https://plausible.io https://pal-chat.net https://eomail4.com https://www.google.com https://1k0gztb8b2.execute-api.us-east-2.amazonaws.com https://www.charitystack.com https://www.donation.charitystack.com",
    "frame-src https://secure.qgiv.com https://calendly.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://validaid.org https://www.charitystack.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");

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
  return transformed;
});
