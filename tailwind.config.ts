import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b0f1a",
          elevated: "#131826",
          hover: "#1a2031",
          card: "#161c2c",
        },
        text: {
          DEFAULT: "#e7ecf5",
          muted: "#8a93a8",
          dim: "#5a6578",
        },
        accent: {
          DEFAULT: "#5ee3ff",   // PS5-ish cyan
          hover: "#82e9ff",
          glow: "rgba(94, 227, 255, 0.5)",
        },
        success: "#4ade80",
        warning: "#fbbf24",
        danger: "#f87171",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(94, 227, 255, 0.15)",
        "glow-strong": "0 0 60px rgba(94, 227, 255, 0.3)",
        tile: "0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 4px 6px -4px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
} satisfies Config;
