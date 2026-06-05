/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        light: {
          DEFAULT: '#FFD700',
          warm: '#FFA500',
          hot: '#FF6347',
          soft: '#FFF8DC',
          glow: 'rgba(255, 215, 0, 0.6)',
        },
        shadow: {
          DEFAULT: '#4B0082',
          deep: '#191970',
          midnight: '#0D0D2B',
          soft: '#9370DB',
          glow: 'rgba(75, 0, 130, 0.6)',
        },
        forest: {
          light: '#90EE90',
          DEFAULT: '#228B22',
          dark: '#006400',
        },
        canyon: {
          light: '#FFA07A',
          DEFAULT: '#CD5C5C',
          dark: '#8B0000',
        },
        castle: {
          light: '#B0C4DE',
          DEFAULT: '#4682B4',
          dark: '#191970',
        },
      },
      fontFamily: {
        game: ['"ZCOOL KuaiLe"', '"Comic Sans MS"', 'cursive'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
