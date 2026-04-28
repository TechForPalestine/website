import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://techforpalestine.org",
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
    prerenderEnvironment: "node",
  }),
  integrations: [
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
