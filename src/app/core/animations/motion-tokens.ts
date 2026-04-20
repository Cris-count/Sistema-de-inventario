/**
 * Tokens de movimiento del sistema. Única fuente de verdad para duraciones y easings.
 *
 * Reglas del sistema (derivadas del brief de motion design):
 * - Microinteracciones: 120–180 ms
 * - Reveal: 220–320 ms
 * - Modal / sidebar: 180–260 ms
 * - Easing suave (ease-out para entradas, ease-in-out para transiciones reversibles)
 * - translateY máximo 24 px
 *
 * Al cambiar un token aquí, toda la app ajusta su ritmo sin tocar componentes.
 */
export const MOTION = {
  duration: {
    micro: '140ms',
    reveal: '260ms',
    revealSlow: '320ms',
    modal: '220ms',
    route: '220ms'
  },
  easing: {
    out: 'cubic-bezier(0.22, 1, 0.36, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)'
  },
  translate: {
    reveal: '16px',
    modal: '8px',
    route: '6px'
  }
} as const;

/** Helper para construir la parte "duration easing" de una animación Angular de forma consistente. */
export const motionTiming = (duration: string, easing: string = MOTION.easing.out): string =>
  `${duration} ${easing}`;
