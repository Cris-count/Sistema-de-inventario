import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { MOTION, motionTiming } from './motion-tokens';

/**
 * Stagger para listas / grids donde los hijos entran en secuencia.
 *
 * Dispara en dos casos:
 *  - Al montar el contenedor (`:enter` del host): stagger inicial de todos los hijos.
 *  - Al cambiar la longitud/colección bindeada (`* => *`): stagger solo de los nuevos items.
 *
 * Uso en host estático (ej. grid de tarjetas de landing):
 *   <div @staggerList>
 *     @for (item of items; track item.id) { <app-card>...</app-card> }
 *   </div>
 *
 * Uso reactivo (ej. tabla que agrega filas):
 *   <div [@staggerList]="rows().length"> ... </div>
 */
export const staggerList = trigger('staggerList', [
  transition(':enter, * => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: `translateY(${MOTION.translate.reveal})` }),
        stagger(60, [
          animate(
            motionTiming(MOTION.duration.reveal),
            style({ opacity: 1, transform: 'translateY(0)' })
          )
        ])
      ],
      { optional: true }
    )
  ])
]);

/**
 * Variante ligera para ítems individuales dentro de un `@for` que se añaden / quitan.
 * Uso: `<li @listItem>` dentro del `@for`.
 */
export const listItem = trigger('listItem', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
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
