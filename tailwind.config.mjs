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
          secondary: "#73656E",
          muted: "#B5B5B5",
          divider: "#D6D6D6",
        },
        brand: {
          DEFAULT: "#AB4956",
          hover: "#ab4958",
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
      red: {
        50: "#fff1f3",
        100: "#ffe0e3",
        200: "#ffc6cc",
        300: "#ff9ea9",
        400: "#ff6778",
        500: "#fc374d",
        600: "#ea182f",
        700: "#ce1126",
        800: "#a21222",
        900: "#861622",
        950: "#49060d",
      },
      green: {
        50: "#ecfff5",
        100: "#d3ffe9",
        200: "#aaffd5",
        300: "#69ffb6",
        400: "#21ff90",
        500: "#00f26f",
        600: "#00ca58",
        700: "#009e48",
        800: "#007a3d",
        900: "#026535",
        950: "#00391b",
      },
    },
  },
  plugins: [],
};
