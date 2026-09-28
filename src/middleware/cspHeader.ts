import { EMBED_PATH } from "../utils/newsletterPopup";

// Pages that our own pages may show in an iframe. Everything else refuses framing.
const EMBEDDABLE_PATHS = new Set([EMBED_PATH]);

export function isEmbeddablePath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return EMBEDDABLE_PATHS.has(normalized);
}

export function frameOptionsFor(pathname: string): "SAMEORIGIN" | "DENY" {
  return isEmbeddablePath(pathname) ? "SAMEORIGIN" : "DENY";
}

export function buildCspHeader(nonce: string, pathname: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' trusts scripts loaded by nonced scripts; removes need for 'unsafe-inline'
    `script-src 'nonce-${nonce}' 'strict-dynamic' https://secure.qgiv.com https://techforpalestine.org/cdn-cgi/ https://eomail4.com https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://prod-donation-elements-b-donationelementsjsfilesb-1m4f4dl6p6b21.s3.us-east-2.amazonaws.com`,
    `style-src 'nonce-${nonce}' 'self' https://fonts.googleapis.com https://secure.qgiv.com`,
    "font-src 'self' https://fonts.gstatic.com https://gallery.eo.page",
    "img-src 'self' data: https:",
    "connect-src 'self' https://plausible.io https://eomail4.com https://www.google.com https://1k0gztb8b2.execute-api.us-east-2.amazonaws.com https://www.charitystack.com https://www.donation.charitystack.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://cdn.growthbook.io",
    // 'self' lets the homepage load /newsletter-embed (the popup's copy of the EmailOctopus form)
    "frame-src 'self' https://secure.qgiv.com https://calendly.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://validaid.org https://www.charitystack.com",
    `frame-ancestors ${isEmbeddablePath(pathname) ? "'self'" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}
