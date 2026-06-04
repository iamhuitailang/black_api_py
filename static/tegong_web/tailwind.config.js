/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gold': '#ffd700',
        'gold-dark': '#b8860b',
        'blood': '#8b0000',
        'blood-dark': '#5c0000',
        'bamboo': '#228b22',
        'bamboo-light': '#90ee90',
        'ice': '#87ceeb',
        'swamp': '#2f4f4f',
      },
      fontFamily: {
        'wuxia': ['"Ma Shan Zheng"', 'cursive'],
        'sans': ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 5px #ffd700, 0 0 10px #ffd700' },
          '50%': { boxShadow: '0 0 20px #ffd700, 0 0 30px #ffd700' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
