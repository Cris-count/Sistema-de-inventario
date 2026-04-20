import { animate, style, transition, trigger } from '@angular/animations';
import { MOTION, motionTiming } from './motion-tokens';

/**
 * Slide desde la derecha. Paneles laterales / drawers del dashboard.
 * Uso: `<aside @slideInRight>...</aside>`
 */
export const slideInRight = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(16px)' }),
    animate(
      motionTiming(MOTION.duration.modal),
      style({ opacity: 1, transform: 'translateX(0)' })
    )
  ]),
  transition(':leave', [
    animate(
      motionTiming(MOTION.duration.modal, MOTION.easing.in),
      style({ opacity: 0, transform: 'translateX(16px)' })
    )
  ])
]);

/**
 * Slide desde la izquierda. Notificaciones laterales, sidebars que abren hacia dentro.
 * Uso: `<aside @slideInLeft>...</aside>`
 */
export const slideInLeft = trigger('slideInLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-16px)' }),
    animate(
      motionTiming(MOTION.duration.modal),
      style({ opacity: 1, transform: 'translateX(0)' })
    )
  ]),
  transition(':leave', [
    animate(
      motionTiming(MOTION.duration.modal, MOTION.easing.in),
      style({ opacity: 0, transform: 'translateX(-16px)' })
    )
  ])
]);

/**
 * Banner / aviso que cae desde arriba. Upgrade prompts, avisos de plan, modo bloqueo.
 * Uso: `<div class="upgrade-banner" @slideDown>...</div>`
 */
export const slideDown = trigger('slideDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-12px)' }),
    animate(
      motionTiming(MOTION.duration.modal),
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ]),
  transition(':leave', [
    animate(
      motionTiming(MOTION.duration.modal, MOTION.easing.in),
      style({ opacity: 0, transform: 'translateY(-12px)' })
    )
  ])
]);

/**
 * Banner que sube desde abajo (toasts persistentes, barras inferiores).
 * Uso: `<div @slideInUp>...</div>`
 */
export const slideInUp = trigger('slideInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate(
      motionTiming(MOTION.duration.modal),
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ]),
  transition(':leave', [
    animate(
      motionTiming(MOTION.duration.modal, MOTION.easing.in),
      style({ opacity: 0, transform: 'translateY(12px)' })
    )
  ])
]);
