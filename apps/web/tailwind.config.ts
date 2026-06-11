import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'sans-serif'],
      },
      colors: {
        surface: 'rgb(var(--surface) / <alpha-value>)',
        accent: { DEFAULT: '#2dd4bf', dark: '#0d9488' },
        accent2: { DEFAULT: '#38bdf8', dark: '#0284c7' },
      },
      borderRadius: {
        card: '22px',
      },
      boxShadow: {
        card: '0 20px 50px rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [],
};
export default config;
