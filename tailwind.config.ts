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
        /* Semantic colors (CSS variables) */
        background: "rgb(var(--background, 12 17 26))",
        foreground: "rgb(var(--foreground, 232 237 247))",
        muted: "rgb(var(--muted, 159 178 201))",
        border: "var(--border)",
        
        /* Page background colors - centralized theming */
        "page-bg": "var(--page-bg)",
        "page-surface": "var(--page-surface)",
        "page-panel": "var(--page-panel)",
        
        /* Custom color palette */
        "dark-bg": "var(--bg)",
        "dark-surface": "var(--surface)",
        "dark-panel": "var(--panel)",
        "dark-muted": "var(--muted-bg)",
        "dark-border": "var(--border)",
        "ink-strong": "var(--ink-strong)",
        "ink-soft": "var(--ink-soft)",
        "ink-muted": "var(--ink-muted)",
        "accent": "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        "accent-ghost": "var(--accent-ghost)",
        "warning": "var(--warning)",
        "danger": "var(--danger)",
        "success": "var(--success)",
      },
      borderRadius: {
        "lg": "var(--radius-lg)",
        "md": "var(--radius-md)",
        "sm": "var(--radius-sm)",
      },
      boxShadow: {
        "ambient": "var(--shadow-ambient)",
        "soft": "var(--shadow-soft)",
      },
      fontFamily: {
        "sans": "var(--font-body)",
        "mono": "var(--font-mono)",
      },
    },
  },
  plugins: [],
};

export default config;
