import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwind from "@astrojs/tailwind";
import svelte from '@astrojs/svelte';


// https://astro.build/config
export default defineConfig({
  integrations: [
    icon(),
    tailwind({
      // Disable injecting a basic `base.css` import on every page.
      applyBaseStyles: false,
    }),
    svelte()
  ],
});
