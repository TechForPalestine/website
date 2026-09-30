# 1. SSR on Cloudflare Pages

Status: accepted

The site runs in Astro's `output: "server"` mode on the `@astrojs/cloudflare` adapter, deployed to Cloudflare Pages with `nodejs_compat`. Almost every page is server-rendered per request rather than prebuilt. React and Svelte components are client islands, mostly `client:only="react"`.

Details: [ARCHITECTURE.md](../ARCHITECTURE.md#rendering-model).
