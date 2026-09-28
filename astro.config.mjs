import { defineConfig } from "astro/config";
import icon from "astro-icon";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";

// Sentry only reports from production builds. Loading it in `astro dev` adds
// server/client instrumentation and a Vite plugin for no benefit.
const isDev = process.argv.includes("dev");

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
    optimizeDeps: {
      include: [
        "@mui/material",
        "@mui/system",
        "@mui/icons-material/AccessTime",
        "@mui/icons-material/AccountBalance",
        "@mui/icons-material/Add",
        "@mui/icons-material/ArrowForwardIos",
        "@mui/icons-material/Block",
        "@mui/icons-material/Business",
        "@mui/icons-material/CalendarToday",
        "@mui/icons-material/Campaign",
        "@mui/icons-material/Close",
        "@mui/icons-material/CloudUpload",
        "@mui/icons-material/Coffee",
        "@mui/icons-material/Delete",
        "@mui/icons-material/Diversity3",
        "@mui/icons-material/Email",
        "@mui/icons-material/Event",
        "@mui/icons-material/ExpandMore",
        "@mui/icons-material/Facebook",
        "@mui/icons-material/FormatQuote",
        "@mui/icons-material/Gavel",
        "@mui/icons-material/GitHub",
        "@mui/icons-material/Group",
        "@mui/icons-material/Groups",
        "@mui/icons-material/Instagram",
        "@mui/icons-material/Language",
        "@mui/icons-material/Launch",
        "@mui/icons-material/Link",
        "@mui/icons-material/LinkedIn",
        "@mui/icons-material/LocationOn",
        "@mui/icons-material/MedicalServices",
        "@mui/icons-material/Money",
        "@mui/icons-material/OpenInNew",
        "@mui/icons-material/People",
        "@mui/icons-material/PeopleAlt",
        "@mui/icons-material/Restaurant",
        "@mui/icons-material/RocketLaunch",
        "@mui/icons-material/Search",
        "@mui/icons-material/Settings",
        "@mui/icons-material/ShoppingCart",
        "@mui/icons-material/Telegram",
        "@mui/icons-material/TrendingUp",
        "@mui/icons-material/Twitter",
        "@mui/icons-material/VolunteerActivism",
        "@mui/icons-material/Work",
        "@mui/icons-material/YouTube",
        "leaflet",
        "react-leaflet",
        "chart.js",
        "react-slick",
      ],
    },
  },
  integrations: [
    !isDev &&
      sentry({
        org: "tech-for-palestine",
        project: "website",
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
          "/supporting-member-new/",
          "/volunteer-new/",
          "/e4p-new/",
          "/help/hire-new/",
          "/mentorship/",
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
        ];
        return !exclude.some((path) => page.endsWith(path));
      },
    }),
  ],
});
