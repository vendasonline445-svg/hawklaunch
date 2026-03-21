/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hawk: {
          bg: '#0a0b0f',
          card: '#181a24',
          input: '#0f1118',
          border: '#2a2d3a',
          accent: '#f97316',
          accent2: '#06b6d4',
          accent3: '#a855f7',
        },
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
