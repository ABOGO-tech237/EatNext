/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /** Vert forêt — mot « Eat Next » et manche du picto (EATNEXT2). */
        brand: {
          50: '#eef6f1',
          100: '#d5eadc',
          200: '#a9d4b8',
          300: '#74b58c',
          400: '#3d8f62',
          500: '#1f6b44',
          600: '#145536',
          700: '#0c4229',
          800: '#08341f',
          900: '#052416',
        },
        /** Rouge Studio — disque du « e » et mot STUDIO. */
        accent: {
          50: '#fdecec',
          100: '#fad4d4',
          200: '#f5a8a8',
          300: '#ee7575',
          400: '#e44545',
          500: '#d41414',
          600: '#d41414',
          700: '#a80f0f',
          800: '#7c0b0b',
          900: '#530707',
        },
        /** Menthe — disque du « e » sur fond forêt / dégradé. */
        mint: {
          400: '#5fffc0',
          500: '#0fffa1',
          600: '#00d986',
        },
        /** Neutres teintés forêt, pas de gris chaud type Yelp. */
        ink: {
          50: '#f4f7f5',
          100: '#e7eeea',
          200: '#cfdad4',
          300: '#a9bdb4',
          400: '#7a9388',
          500: '#5a7369',
          600: '#445a52',
          700: '#344640',
          800: '#1c2e26',
          900: '#08341f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(8, 52, 31, 0.06), 0 4px 12px rgba(8, 52, 31, 0.04)',
        'card-hover': '0 8px 24px rgba(8, 52, 31, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
