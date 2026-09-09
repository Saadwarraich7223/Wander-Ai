import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#FAF9F5",
        surface: "#FAF9F5",
        "surface-bright": "#FAF9F5",
        "surface-dim": "#DBDAD6",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F5F4F0",
        "surface-container": "#EFEEEA",
        "surface-container-high": "#E9E8E4",
        "surface-container-highest": "#E3E2DF",
        "on-surface": "#1B1C1A",
        "on-surface-variant": "#444748",
        outline: "#747878",
        "outline-variant": "#C4C7C7",
        primary: "#000000",
        "on-primary": "#FFFFFF",
        "primary-container": "#1C1B1B",
        "inverse-primary": "#C8C6C5",
        secondary: "#186A57",
        "secondary-dark": "#165345",
        "secondary-light": "#EAF5F2",
        "secondary-container": "#A5F2D9",
        "on-secondary-container": "#21705D",
        "on-secondary-fixed-variant": "#005141",
        "on-secondary": "#FFFFFF",
        tertiary: "#000000",
        "tertiary-container": "#291800",
        "tertiary-fixed": "#FFDDB0",
        "tertiary-fixed-dim": "#FDBA4F",
        "on-tertiary-fixed": "#291800",
        "inverse-on-surface": "#F2F1ED",
        "error-container": "#FFDAD6",
        "on-error-container": "#93000A",
        accent: "#E8A83E",
        "accent-soft": "#FDF4E5"
      },
      spacing: {
        "unit-1": "0.25rem",
        "unit-2": "0.5rem",
        "unit-3": "0.75rem",
        "unit-4": "1rem",
        "unit-5": "1.25rem",
        "unit-6": "1.5rem",
        "unit-8": "2rem",
        "unit-10": "2.5rem",
        "unit-12": "3rem",
        "unit-16": "4rem",
        "unit-20": "5rem",
        "margin-mobile": "1.25rem",
        "margin-tablet": "2rem",
        "margin-desktop": "3.5rem",
        "gutter-mobile": "1rem",
        "gutter-tablet": "1.5rem",
        "gutter-desktop": "2rem",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"]
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'elevated': '0 12px 32px -4px rgba(21, 21, 21, 0.08), 0 4px 12px -2px rgba(21, 21, 21, 0.04)',
        'glow': '0 0 24px -2px rgba(31, 111, 92, 0.25)'
      }
    },
  },
  plugins: [],
};

export default config;

