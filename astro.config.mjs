import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://techforpalestine.org",
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
  }),
  vite: {
    resolve: {
      alias: import.meta.env.PROD && {
        "react-dom/server": "react-dom/server.edge",
      },
    },
    ssr: {
      external: ["node:fs/promises", "node:path", "node:url", "node:crypto"],
    },
    build: {
      // "hidden" generates source maps but doesn't serve them publicly
      sourcemap: "hidden",
    },
  },
  integrations: [
    sentry({
      org: "tech-for-palestine",
      project: "javascript-astro",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourceMapsUploadOptions: {
        enabled: !!process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    icon(),
    react(),
    tailwind({
      // Disable injecting a basic `base.css` import on every page.
      applyBaseStyles: false,
    }),
    svelte({
      compilerOptions: {
        experimental: {
          async: true,
        },
      },
    }),
    sitemap(),
  ],
});
