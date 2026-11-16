import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { paper: "#FAF8F5", ink: "#111827", navy: "#1E3A8A", forest: "#166534", amber: "#B45309" },
      fontFamily: { sans: ["Atkinson Hyperlegible Next Variable", "Arial", "sans-serif"], display: ["DM Serif Text", "Georgia", "serif"] },
    },
  },
  plugins: [],
} satisfies Config;
