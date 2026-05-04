import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
        },
        accent: "var(--accent)",
        danger: "var(--danger)",
        success: "var(--success)",
        neumorphic: {
          light: "var(--shadow-light)",
          dark: "var(--shadow-dark)",
        }
      },
      boxShadow: {
        'neu-flat': '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
        'neu-pressed': 'inset 8px 8px 16px var(--shadow-dark), inset -8px -8px 16px var(--shadow-light)',
      }
    },
  },
  plugins: [],
};
export default config;
