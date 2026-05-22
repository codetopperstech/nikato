import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7ED957',
          dark:    '#5cb83a',
          light:   '#edfbdc',
        },
        accent: {
          DEFAULT: '#7CCBFF',
          light:   '#e8f6ff',
        },
        surface: {
          DEFAULT: '#F9FBF8',
          2:       '#F4F7F2',
        },
      },
      borderRadius: {
        xl:  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        brand: '0 4px 16px rgba(126,217,87,0.30)',
        card:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
