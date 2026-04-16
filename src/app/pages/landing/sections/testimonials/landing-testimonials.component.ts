import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

@Component({
  selector: 'app-landing-testimonials',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  template: `
    <section class="bg-background py-section dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
            Equipos que ya no discuten el stock
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Voces representativas de operaciones reales. Sustituye por testimonios verificados cuando los tengas.
          </p>
        </div>

        <div class="mt-12 grid gap-5 md:grid-cols-3">
          @for (t of items; track t.author) {
            <app-ui-card class="h-full">
              <p class="text-sm leading-relaxed text-primary/90 dark:text-slate-300">“{{ t.quote }}”</p>
              <div class="mt-4 text-sm">
                <p class="font-semibold text-primary dark:text-slate-100">{{ t.author }}</p>
                <p class="text-secondary dark:text-slate-400">{{ t.role }}</p>
              </div>
            </app-ui-card>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingTestimonialsComponent {
  readonly items = [
    {
      quote: 'Pasamos de reconciliar Excel los viernes a cerrar el mes con números que todos confían.',
      author: 'Mariana López',
      role: 'Jefa de operaciones · Retail B2B'
    },
    {
      quote: 'El historial de movimientos nos salvó en una auditoría: responsable, fecha y bodega en un solo lugar.',
      author: 'Diego Pérez',
      role: 'Administrador de bodega · Distribución'
    },
    {
      quote: 'Compras dejó de comprar “a ojo”. Las alertas de mínimo nos dieron semanas de anticipación.',
      author: 'Laura Gómez',
      role: 'Gerente de compras · Industria liviana'
    }
  ];
}
