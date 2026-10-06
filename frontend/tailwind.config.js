/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          bg: '#0f0e17',
          card: '#181623',
          border: '#29253b',
          accent: '#a78bfa',
          light: '#e9d5ff',
          muted: '#7e7b99',
          surface: '#13111e'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
