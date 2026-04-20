import { animate, style, transition, trigger } from '@angular/animations';
import { MOTION, motionTiming } from './motion-tokens';

/**
 * Fondo (backdrop) del modal. Fade puro sin transform para no competir con el diálogo.
 * Uso: `<div class="modal-backdrop" @backdropFade>...</div>`
 */
export const backdropFade = trigger('backdropFade', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(motionTiming(MOTION.duration.modal), style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate(motionTiming(MOTION.duration.modal, MOTION.easing.in), style({ opacity: 0 }))
  ])
]);

/**
 * Diálogo del modal: fade + scale + traslado sutil. Dentro de los rangos del sistema (no rebota).
 * Uso: `<div class="modal-dialog" @modalFadeScale>...</div>`
 */
export const modalFadeScale = trigger('modalFadeScale', [
  transition(':enter', [
    style({ opacity: 0, transform: `translateY(${MOTION.translate.modal}) scale(0.98)` }),
    animate(
      motionTiming(MOTION.duration.modal),
      style({ opacity: 1, transform: 'translateY(0) scale(1)' })
    )
  ]),
  transition(':leave', [
    animate(
      motionTiming(MOTION.duration.modal, MOTION.easing.in),
      style({ opacity: 0, transform: `translateY(${MOTION.translate.modal}) scale(0.98)` })
    )
  ])
]);
