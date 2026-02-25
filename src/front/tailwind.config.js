/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e5e7eb',
        },
        light: {
          bg: '#ffffff',
          card: '#f3f4f6',
          border: '#e5e7eb',
          text: '#1f2937',
        }
      }
    },
  },
  plugins: [],
}
