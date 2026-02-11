import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rasya: {
          dark: "#0f0f12",
          surface: "#18181c",
          card: "#1e1e24",
          border: "#2a2a32",
          muted: "#71717a",
          accent: "#eab308",
          "accent-dim": "#a16207",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-body)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
