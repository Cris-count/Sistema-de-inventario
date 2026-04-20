/** @type {import('tailwindcss').Config} */

/**
 * Tailwind config — bridge con design tokens oficiales.
 *
 * La paleta, tipografía, radios y sombras se leen desde las CSS custom
 * properties definidas en `src/app/core/design/tokens.css`. Cambiar un token
 * = cambia en toda la app.
 *
 * - `darkMode: 'class'` alineado con ThemeService (añade clase `dark` en html).
 * - `important: true` para evitar que la encapsulación del body oscuro del
 *   dashboard pise utilidades de landing/registro.
 * - `preflight: false` porque el panel administrativo trae su propio reset.
 *
 * IMPORTANTE: El canal de color se declara como triple RGB sin `rgb(...)` en
 * tokens.css para permitir el patrón `rgb(var(--color-x) / <alpha-value>)`,
 * que es el oficial de Tailwind v4 para componer alpha.
 */
export default {
  darkMode: 'class',
  important: true,
  corePlugins: {
    preflight: false
  },
  content: ['./src/app/**/*.{html,ts}', './src/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)']
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: 'var(--text-display-lh)' }],
        h1: ['var(--text-h1)', { lineHeight: 'var(--text-h1-lh)' }],
        h2: ['var(--text-h2)', { lineHeight: 'var(--text-h2-lh)' }],
        h3: ['var(--text-h3)', { lineHeight: 'var(--text-h3-lh)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: '1.6' }],
        body: ['var(--text-body)', { lineHeight: '1.55' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: '1.5' }],
        caption: ['var(--text-caption)', { lineHeight: '1.45' }]
      },
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          strong: 'rgb(var(--color-accent-strong) / <alpha-value>)',
          soft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
          foreground: 'rgb(var(--color-accent-foreground) / <alpha-value>)'
        },
        info: {
          DEFAULT: 'rgb(var(--color-info) / <alpha-value>)',
          soft: 'rgb(var(--color-info-soft) / <alpha-value>)'
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
          soft: 'rgb(var(--color-success-soft) / <alpha-value>)'
        },
        warning: {
          DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)',
          soft: 'rgb(var(--color-warning-soft) / <alpha-value>)'
        },
        danger: {
          DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)',
          soft: 'rgb(var(--color-danger-soft) / <alpha-value>)'
        },
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)'
        },
        primary: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          foreground: 'rgb(var(--color-surface) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-text-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-surface) / <alpha-value>)'
        }
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)'
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        soft: 'var(--shadow-soft)'
      },
      spacing: {
        section: 'var(--space-section)',
        'section-sm': 'var(--space-section-sm)'
      },
      zIndex: {
        nav: 'var(--z-nav)',
        drawer: 'var(--z-drawer)',
        header: 'var(--z-header)',
        fab: 'var(--z-fab)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)'
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)'
      },
      transitionTimingFunction: {
        out: 'var(--easing-out)',
        'in-out': 'var(--easing-in-out)'
      }
    }
  }
};
