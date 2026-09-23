/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A83F5B',        // Berry Rose
        secondary: '#E8A0AD',      // Soft Rose
        accent: '#C9A45C',         // Champagne Gold
        'warm-ivory': '#FFF9F5',   // Background
        surface: '#FFFFFF',        // Surface
        charcoal: '#29252A',       // Heading
        'soft-gray': '#6F6870',    // Body
        success: '#3F7D58',        // Green
        error: '#C84B4B',          // Red
      },
      fontFamily: {
        sans: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(41, 37, 42, 0.05)',
        'card-hover': '0 10px 25px -4px rgba(168, 63, 91, 0.12)',
        'modal': '0 25px 50px -12px rgba(41, 37, 42, 0.25)',
      }
    },
  },
  plugins: [],
}
