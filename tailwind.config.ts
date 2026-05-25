import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0908",
          900: "#11100e",
          800: "#1a1815",
          700: "#26221d",
          600: "#3a342c",
          500: "#5a5246",
        },
        bone: {
          50: "#f5f1e8",
          100: "#ebe5d3",
          200: "#d4ccb5",
        },
        amber: {
          glow: "#ffb547",
          burn: "#ff7a1a",
          deep: "#c75a00",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
    },
  },
  plugins: [],
} satisfies Config;
