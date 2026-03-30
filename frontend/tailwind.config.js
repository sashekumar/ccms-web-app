/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8eef7',
          100: '#c7d5ea',
          200: '#a3badd',
          300: '#7f9fd0',
          400: '#648ac6',
          500: '#4975bc',
          600: '#3a66b1',
          700: '#2a5298',
          800: '#1e3c72',
          900: '#162c55',
        },
        secondary: {
          DEFAULT: '#f8f9fa',
        },
        border: {
          DEFAULT: '#dee2e6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.7rem',
        'sm': '0.8rem',
        'base': '0.85rem',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        slideIn: 'slideIn 0.2s ease-out',
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
