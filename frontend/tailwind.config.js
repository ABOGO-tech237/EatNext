/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Rouge chaleureux inspiré Yelp — identité EatNext */
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#d32323',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        /** Nuances neutres chaudes (pas de gris froid « template ») */
        ink: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(28, 25, 23, 0.06), 0 4px 12px rgba(28, 25, 23, 0.04)',
        'card-hover': '0 8px 24px rgba(28, 25, 23, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
};
