/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDF8F3',
          100: '#FAF0E6',
          200: '#F5E6D3',
        },
        terracotta: {
          DEFAULT: '#C45C3E',
          light: '#D97B5A',
          dark: '#A04830',
        },
        forest: {
          DEFAULT: '#2D5A3D',
          light: '#3D7A52',
          dark: '#1E3D28',
        },
        sand: '#E8D5B7',
        charcoal: '#2C2C2C',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(44, 44, 44, 0.08)',
        'card-hover': '0 8px 24px rgba(44, 44, 44, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
