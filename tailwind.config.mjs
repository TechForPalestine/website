/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      red: {
        50: "#fef2f2",
        100: "#fde3e3",
        200: "#fccccc",
        300: "#f9a8a8",
        400: "#f37676",
        500: "#e94a4a",
        600: "#d83838",
        700: "#b42121",
        800: "#951f1f",
        900: "#7c2020",
        950: "#430c0c",
      },
      green: {
        50: "#f0fdf5",
        100: "#dcfceb",
        200: "#bbf7d7",
        300: "#86efb8",
        400: "#49df91",
        500: "#21c671",
        600: "#149954",
        700: "#158049",
        800: "#16653d",
        900: "#145334",
        950: "#052e1b",
      },
    },
  },
  plugins: [],
};
