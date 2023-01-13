/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        bigShouldersDisplay: ['var(--font-big-shoulders-display)'],
        mulish: ['var(--font-mulish)']
      },
      colors: {
        vantactGray: {
          50: '#f3f4f4',
          100: '#c6c8ca',
          200: '#989ca0',
          300: '#6b7075',
          400: '#3d454b',
          500: '#101921',
          600: '#0d141b',
          700: '#0a1014',
          800: '#070b0e',
          900: '#040608'
        }
      }
    },
  },
  plugins: [],
};
