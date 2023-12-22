/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
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
