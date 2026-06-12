/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'ice': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'snow': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
        },
        'warm': {
          orange: '#FFB347',
          pink: '#FFB6C1',
          mint: '#98FB98',
          lavender: '#E6E6FA',
        }
      },
      fontFamily: {
        'cute': ['"Comic Sans MS"', '"Marker Felt"', 'cursive'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'snowfall': 'snowfall 10s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        snowfall: {
          '0%': { transform: 'translateY(-100%) translateX(0)' },
          '100%': { transform: 'translateY(100vh) translateX(50px)' },
        },
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(135, 206, 235, 0.5)',
        'cute': '0 6px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
