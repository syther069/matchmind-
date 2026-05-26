import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bg1: "var(--bg1)",
        bg2: "var(--bg2)",
        bg3: "var(--bg3)",
        text: "var(--text)",
        green: "var(--green)",
        coral: "var(--coral)",
        amber: "var(--amber)",
        blue: "var(--blue)",
        border: "var(--border)",
        muted: "var(--muted)"
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px"
      },
      fontFamily: {
        display: ["Syne", "Arial", "sans-serif"],
        mono: ["DM Mono", "Consolas", "monospace"],
        serif: ["Instrument Serif", "Georgia", "serif"]
      }
    }
  },
  plugins: [animate]
};

export default config;
