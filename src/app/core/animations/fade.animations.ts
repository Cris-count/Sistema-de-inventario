import { animate, style, transition, trigger } from '@angular/animations';
import { MOTION, motionTiming } from './motion-tokens';

/**
 * Fade simple en entrada. Para elementos que aparecen con `@if` y se quedan.
 * Uso: `<div @fadeIn>...</div>`
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(motionTiming(MOTION.duration.reveal), style({ opacity: 1 }))
  ])
]);

/**
 * Fade + traslado sutil desde abajo. Reveal estándar del sistema.
 * Uso: `<section @fadeUp>...</section>`
 */
export const fadeUp = trigger('fadeUp', [
  transition(':enter', [
    style({ opacity: 0, transform: `translateY(${MOTION.translate.reveal})` }),
    animate(
      motionTiming(MOTION.duration.reveal),
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ])
]);

/**
 * Fade + traslado sutil desde arriba. Útil para avisos o tarjetas que "caen".
 * Uso: `<div @fadeDown>...</div>`
 */
export const fadeDown = trigger('fadeDown', [
  transition(':enter', [
    style({ opacity: 0, transform: `translateY(-${MOTION.translate.reveal})` }),
    animate(
      motionTiming(MOTION.duration.reveal),
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ])
]);

/**
 * Entrada + salida para alertas, banners y feedback de guardado/error del dashboard.
 * Anima solo opacity + translate (no height) para evitar saltos de layout.
 * Uso: `<div class="alert" @fadeInOut>...</div>`
 */
export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-4px)' }),
    animate(
      motionTiming(MOTION.duration.micro),
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ]),
  transition(':leave', [
    animate(
      motionTiming(MOTION.duration.micro, MOTION.easing.in),
      style({ opacity: 0, transform: 'translateY(-4px)' })
    )
  ])
]);
