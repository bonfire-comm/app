/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
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
        },
        cloudy: {
          50: '#f4f5f6',
          100: '#ccd0d5',
          200: '#a4abb4',
          300: '#7c8693',
          400: '#536171',
          500: '#293a50',
          600: '#233141',
          700: '#1b2532',
          800: '#121a22',
          900: '#0a0e13'
        },
        'light-blue': {
          50: '#fdfeff',
          100: '#f5faff',
          200: '#edf6ff',
          300: '#e4f3ff',
          400: '#dcefff',
          500: '#d4ebff',
          600: '#acbecf',
          700: '#83929e',
          800: '#5b656e',
          900: '#33383d'
        }
      }
    },
  },
  plugins: [],
};
