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
  prefetch: {
    defaultStrategy: "hover",
  },
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
    sitemap({
      filter: (page) => {
        const exclude = [
          "/coming-soon/",
          "/incubator-new/",
          "/project-details-temp/",
          "/project/",
          "/success/",
          "/vercel/",
          "/donate-2/",
          "/donate-new/",
          "/donate-2-new/",
          "/404/",
          "/about-new/",
          "/team-new/",
          "/faq-new/",
          "/contact-new/",
          "/projects-new/",
          "/ideas-new/",
          "/tools-new/",
          "/js/web.js/",
          "/admin/conversions/",
          "/membership-new/",
          "/volunteer-new/",
          "/e4p-new/",
          "/help/hire-new/",
          "/mentorship-new/",
          "/london-gathering-new/",
          "/get-involved-new/",
          "/media-new/",
          "/legal-new/",
          "/terms-new/",
          "/privacy-policy-new/",
          "/events-new/",
          "/home-new/",
          "/endorsements-new/",
          "/e4p/pledge-new/",
          "/community-call-old/",
        ];
        return !exclude.some((path) => page.endsWith(path));
      },
    }),
  ],
});
