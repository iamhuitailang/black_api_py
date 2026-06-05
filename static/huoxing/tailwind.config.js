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
        mars: {
          DEFAULT: '#C1440E',
          50: '#FDEAE2',
          100: '#FBD4C5',
          200: '#F7A98B',
          300: '#F37E51',
          400: '#EF5317',
          500: '#C1440E',
          600: '#91330B',
          700: '#612207',
          800: '#301104',
          900: '#180802',
        },
        space: {
          DEFAULT: '#0A0A0F',
          50: '#E8E8EA',
          100: '#D1D1D5',
          200: '#A3A3AB',
          300: '#757581',
          400: '#474757',
          500: '#1A1A2D',
          600: '#141424',
          700: '#0F0F1B',
          800: '#0A0A12',
          900: '#050509',
        },
        tech: {
          DEFAULT: '#00D4FF',
          50: '#E6FAFF',
          100: '#BFF3FF',
          200: '#80E7FF',
          300: '#40DAFF',
          400: '#00CDFF',
          500: '#00D4FF',
          600: '#00A8CC',
          700: '#007C99',
          800: '#005066',
          900: '#002433',
        },
        warning: {
          DEFAULT: '#FF6B00',
          50: '#FFF0E6',
          100: '#FFE0CC',
          200: '#FFC299',
          300: '#FFA366',
          400: '#FF8533',
          500: '#FF6B00',
          600: '#CC5500',
          700: '#994000',
          800: '#662A00',
          900: '#331500',
        },
      },
      boxShadow: {
        'neon-blue': '0 0 5px #00D4FF, 0 0 10px #00D4FF, 0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-red': '0 0 5px #C1440E, 0 0 10px #C1440E, 0 0 20px rgba(193, 68, 14, 0.5)',
        'neon-orange': '0 0 5px #FF6B00, 0 0 10px #FF6B00, 0 0 20px rgba(255, 107, 0, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #00D4FF, 0 0 10px #00D4FF' },
          '100%': { boxShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF, 0 0 30px #00D4FF' },
        },
        scan: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [],
};
