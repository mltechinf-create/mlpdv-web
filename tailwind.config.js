/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006669',
          light: '#00A5AB',
          dark: '#004d4f',
        },
      },
    },
  },
  plugins: [],
}
