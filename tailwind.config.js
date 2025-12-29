const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          50: '#f5eff7',
          100: '#ebdeef',
          200: '#d6bde0',
          300: '#c29bd0',
          400: '#ac79c0',
          500: '#9757b1',
          600: '#7d4296',
          700: '#64327a',
          800: '#5A1B63', // Primary Deep Plum
          900: '#3e1145',
          950: '#230728',
        },
        teal: {
          50: '#effbf8',
          100: '#dff6f1',
          200: '#bfece4',
          300: '#9fe1d7',
          400: '#7fd6ca',
          500: '#5fccbd',
          600: '#2FA39A', // Secondary Teal
          700: '#26827b',
          800: '#1d625c',
          900: '#13413d',
          950: '#0a211f',
        },
        surface: {
          DEFAULT: '#F8FAFB',
          glass: 'rgba(255, 255, 255, 0.6)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
module.exports = config
