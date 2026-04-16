/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  /* true: las utilidades aplican con !important y no fallan por encapsulación / herencia del body oscuro. */
  important: true,
  corePlugins: {
    preflight: false
  },
  content: [
    './src/app/pages/landing/**/*.{html,ts}',
    './src/app/pages/register/**/*.{html,ts}',
    './src/app/shared/components/ui/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        primary: {
          DEFAULT: '#0f172a',
          foreground: '#f8fafc'
        },
        secondary: {
          DEFAULT: '#64748b',
          foreground: '#f1f5f9'
        },
        accent: {
          DEFAULT: '#0d9488',
          foreground: '#ecfdf5'
        },
        background: '#f8fafc',
        surface: '#ffffff'
      },
      spacing: {
        section: '5rem',
        'section-sm': '3.5rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.06)'
      }
    }
  }
};
