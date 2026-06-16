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
        ink: {
          50: '#f5f3ef',
          100: '#e6e2da',
          200: '#c8c0b0',
          300: '#a89b85',
          400: '#8a7b63',
          500: '#6b5c48',
          600: '#544737',
          700: '#3d3428',
          800: '#2a231c',
          900: '#1a1612',
          950: '#0f0d0a'
        },
        cinnabar: {
          DEFAULT: '#c23b22',
          light: '#e05a42',
          dark: '#8f2b18'
        },
        gold: {
          DEFAULT: '#d4a574',
          light: '#e6bd93',
          dark: '#b08957'
        },
        jade: {
          DEFAULT: '#4a7c59',
          light: '#6a9a78',
          dark: '#355a40'
        },
        amethyst: {
          DEFAULT: '#6b4c9a',
          light: '#8b6cb8',
          dark: '#4f3773'
        }
      },
      fontFamily: {
        wuxia: ['"ZCOOL XiaoWei"', '"Noto Serif SC"', 'serif'],
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', 'serif']
      },
      boxShadow: {
        'scroll': '0 0 30px rgba(212, 165, 116, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.1)',
        'glow-red': '0 0 20px rgba(194, 59, 34, 0.6)',
        'glow-gold': '0 0 20px rgba(212, 165, 116, 0.6)'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' }
        }
      }
    },
  },
  plugins: [],
};
