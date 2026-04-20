import { animate, query, style, transition, trigger } from '@angular/animations';
import type { RouterOutlet } from '@angular/router';
import { MOTION, motionTiming } from './motion-tokens';

/**
 * Transición entre rutas para el dashboard. Fade + 6 px de translateY — casi imperceptible,
 * solo para romper el "salto seco" al cambiar de sección sin distraer al operador.
 *
 * Uso (en app-shell):
 *   template:
 *     <div class="main-inner" [@routeFadeAnimation]="prepareRoute(outlet)">
 *       <router-outlet #outlet="outlet" />
 *     </div>
 *   component:
 *     prepareRoute = prepareRouteSnapshot;
 */
export const routeFadeAnimation = trigger('routeFadeAnimation', [
  transition('* <=> *', [
    query(
      ':enter',
      [style({ opacity: 0, transform: `translateY(${MOTION.translate.route})` })],
      { optional: true }
    ),
    query(
      ':enter',
      [
        animate(
          motionTiming(MOTION.duration.route),
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ],
      { optional: true }
    )
  ])
]);

/**
 * Extrae una clave estable por ruta para alimentar el trigger `@routeFadeAnimation`.
 * Cambia cuando cambia la ruta activa, lo que dispara la transición.
 * Si no hay outlet activo (primera carga) devuelve `''`, que no dispara animación.
 */
export function prepareRouteSnapshot(outlet: RouterOutlet | null | undefined): string {
  if (!outlet?.isActivated) {
    return '';
  }
  const data = outlet.activatedRouteData;
  if (data && typeof data['animation'] === 'string') {
    return data['animation'] as string;
  }
  return outlet.activatedRoute?.snapshot?.url?.map((s) => s.path).join('/') ?? '';
}
