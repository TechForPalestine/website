import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwind from "@astrojs/tailwind";
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';


// https://astro.build/config
export default defineConfig({
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
