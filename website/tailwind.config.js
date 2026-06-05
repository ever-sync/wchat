/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        octa: {
          dark: '#1e253c',      // Dark background
          green: '#4ade80',     // Bright green accent
          textMain: '#1e253c',  // Text dark color
          bgLight: '#f8fafc',   // Light gray background
        }
      }
    },
  },
  plugins: [],
}
