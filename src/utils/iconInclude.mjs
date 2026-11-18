// The only icons bundled into the server. Without this list astro-icon bundles
// every icon of every installed @iconify-json set (about 20 MiB), which pushed
// the Cloudflare Pages Functions bundle past its 25 MiB limit.
//
// Add an icon here when you use a new one: an icon missing from this list
// throws when the page renders (SSR), not at build time.
// src/utils/iconInclude.test.ts fails if src/ uses an icon not listed here.

/** @type {Record<string, string[]>} */
export const ICON_INCLUDE = {
  mdi: [
    "arrow-down",
    "arrow-left",
    "arrow-right",
    "book-open-page-variant-outline",
    "close",
    "download",
    "email-outline",
    "github",
    "instagram",
    "linkedin",
    "mastodon",
    "open-in-new",
    "plus",
    "twitter",
    "youtube",
  ],
  ic: ["baseline-discord", "baseline-tiktok"],
  "simple-icons": ["bluesky"],
  solar: ["hamburger-menu-outline"],
  tabler: ["layout-sidebar-left-collapse", "layout-sidebar-left-expand", "video"],
};
