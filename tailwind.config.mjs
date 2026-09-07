/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,css,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
      },
      colors: {
        page: "#FFFBF5",
        cream: "#FBF2ED",
        butter: "#F7EAD4",
        sand: "#F7F2E8",
        ink: {
          DEFAULT: "#2A2428",
          dark: "#201D1E",
          secondary: "#73656E",
          muted: "#B5B5B5",
          divider: "#D6D6D6",
        },
        brand: {
          DEFAULT: "#AB4956",
          hover: "#D35464",
          light: "#E8727F",
        },
        // Muted warm sage — a "positive/upcoming" status color derived to sit
        // next to the cream/butter/rose palette instead of a generic bright
        // green.
        positive: {
          DEFAULT: "#5C7A52",
          tint: "#EDF1E8",
        },
        // Legacy-site accent: the single green used on Layout.astro pages.
        // DEFAULT/hover match Tailwind's green-800/900 so existing pages that
        // already use those classes stay visually identical while migrating.
        accent: {
          DEFAULT: "#166534",
          hover: "#14532D",
          // Slightly desaturated and a shade lighter than a pure flag green, so a
          // large dark surface reads institutional rather than saturated.
          deep: "#0E2C1F",
          // The CTA band now runs on the brand accent itself, so its two cards
          // step DOWNWARD to keep text contrast (a lighter panel on a mid-green
          // ground drops secondary text below 4.5:1). Reads as deep-green plates
          // set into a brighter field: ground -> panel2 1.28, ground -> panel 2.11.
          panel: "#0E2C1F",
          panel2: "#14532D",
          tint: "#EEF5EF",
          // One step deeper than `tint`, for surfaces that sit *on* a tinted
          // card (icon tiles, the corner arc in the support cards).
          tile: "#DCE8DF",
        },
        // Warm ground for alternating sections. With borders and shadows both
        // ruled out, the fill is the ONLY separation cue, so this is tuned deep
        // enough that a white card on it is a 1.37:1 step. Text still clears AA:
        // stone-900 12.8, stone-700 7.5, stone-600 5.6, accent 5.2.
        paper: "#E6DBC8",
        // The Palestinian flag bars in the homepage hero. Kept as the exact
        // values the hero has always used, named so they are no longer
        // anonymous hex literals in the markup.
        flag: {
          green: "#268024",
          red: "#E4312B",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Fraunces Placeholder", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};
