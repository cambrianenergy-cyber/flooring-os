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
        /* Green and white color scheme */
        primary: '#22c55e', // Tailwind green-500
        secondary: '#16a34a', // Tailwind green-700
        background: '#ffffff',
        foreground: '#22c55e',
        muted: '#e5e7eb', // Tailwind gray-200
        border: '#22c55e',
        pageBg: '#ffffff',
        pageSurface: '#f0fdf4', // Tailwind green-50
        pagePanel: '#d1fae5', // Tailwind green-100
        accent: '#22c55e',
        accentStrong: '#16a34a',
        accentGhost: '#bbf7d0', // Tailwind green-200
        warning: '#facc15', // Tailwind yellow-400
        danger: '#ef4444', // Tailwind red-500
        success: '#22c55e',
      },
      borderRadius: {
        lg: '1rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      boxShadow: {
        ambient: '0 4px 24px rgba(34,197,94,0.12)',
        soft: '0 2px 8px rgba(34,197,94,0.08)',
      },
      fontFamily: {
        sans: 'Inter, sans-serif',
        mono: 'Menlo, Monaco, Consolas, monospace',
      },
    },
  },
  plugins: [],
};

export default config;
