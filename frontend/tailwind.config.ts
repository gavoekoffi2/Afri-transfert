import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Bleu marine du logo « Afri » — couleur primaire / structure.
        brand: {
          50: '#eef2fb',
          100: '#dae2f5',
          200: '#b9c8ec',
          300: '#8ea4dd',
          400: '#5f78c8',
          500: '#3d54ad',
          600: '#2b3d88',
          700: '#22306b',
          800: '#18224d',
          900: '#101730',
          950: '#0a0f22',
        },
        // Vert du logo « Transfert » — accent / action / succès.
        accent: {
          50: '#ecfdf3',
          100: '#d2f7df',
          200: '#a8efc1',
          300: '#6ee19b',
          400: '#36c66f',
          500: '#1aa64f',
          600: '#138a41',
          700: '#136c36',
          800: '#14562e',
          900: '#0f3f24',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
