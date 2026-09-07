/**
 * The single sitewide `NonprofitOrganization` JSON-LD node.
 *
 * Structured-data parsers do not reliably merge separate <script> tags that
 * share an @id, so exactly one layout must emit this per page — never both.
 * `Layout.astro` and `HomeLayout.astro` each render it once, and a page uses
 * one layout or the other.
 *
 * `extra` is spread before the fixed fields so a caller can add properties
 * (e.g. a page-specific contactPoint or potentialAction) without being able
 * to overwrite the organization's identity.
 */
export function organizationSchema(extra?: Record<string, unknown>) {
  return {
    "@context": "https://schema.org",
    "@type": "NonprofitOrganization",
    "@id": "https://techforpalestine.org/#organization",
    ...extra,
    name: "Tech for Palestine",
    url: "https://techforpalestine.org",
    logo: "https://techforpalestine.org/t4p-social-logo.png",
    taxID: "99-3441367",
    address: {
      "@type": "PostalAddress",
      streetAddress: "548 Market St #266950",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94104-5401",
      addressCountry: "US",
    },
    sameAs: [
      "https://www.instagram.com/techforpalestine",
      "https://twitter.com/tech4palestine",
      "https://github.com/TechForPalestine/",
      "https://www.linkedin.com/company/techforpalestine/",
      "https://infosec.exchange/@tech4palestine",
      "https://www.youtube.com/@tech4palestine",
      "https://techforpalestine.org/discord-invite",
      "https://www.tiktok.com/@techforpalestine",
      "https://bsky.app/profile/techforpalestine.org",
    ],
  };
}
