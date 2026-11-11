/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#e0f2fe',
          200: '#bae6fd',
          500: '#0284c7', // Ocean Blue
          600: '#0369a1',
          700: '#075985',
          marine: '#0891b2', // Teal/Marine
          teal: '#0d9488',
        }
      }
    },
  },
  plugins: [],
}
