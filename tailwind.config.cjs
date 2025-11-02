
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'card': '0 6px 16px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
