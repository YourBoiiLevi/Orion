/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#f4f4f0',
          black: '#111111',
          red: '#e5482b',
        }
      },
      fontFamily: {
        masthead: ['"Playfair Display"', 'serif'],
        ui: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
