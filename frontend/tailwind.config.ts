import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"],
      },
      colors: {
        hangar: {
          950: "#06101f",
          900: "#091827",
          800: "#0d2135",
          700: "#14314d",
        },
        aero: {
          500: "#2f9cff",
          400: "#63b8ff",
          300: "#9fd4ff",
        },
      },
      boxShadow: {
        glow: "0 0 32px rgba(47, 156, 255, 0.18)",
      },
      animation: {
        pulseAlert: "pulseAlert 1.3s ease-in-out infinite",
      },
      keyframes: {
        pulseAlert: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(248, 113, 113, 0)" },
          "50%": { boxShadow: "0 0 26px rgba(248, 113, 113, 0.45)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
