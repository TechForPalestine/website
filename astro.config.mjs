import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwind from "@astrojs/tailwind";
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare'
  }),
  vite: {
    resolve: {
      alias: import.meta.env.PROD && {
        'react-dom/server': 'react-dom/server.edge',
      },
    },
  },
  integrations: [
    icon(),
    react(),
    tailwind({
      // Disable injecting a basic `base.css` import on every page.
      applyBaseStyles: false,
    }),
    svelte()
  ],
});
