import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

@Component({
  selector: 'app-landing-problem-solution',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  template: `
    <section class="bg-background py-section dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
            De “no sabemos cuánto hay” a decisiones con respaldo
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            El dolor no es el inventario en sí: es la desconfianza en los números. Centraliza movimientos,
            responsables y saldos por bodega para que compras, bodega y administración hablen el mismo idioma.
          </p>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-2">
          <app-ui-card>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Problema</h3>
            <ul class="mt-4 space-y-3 text-sm leading-relaxed text-secondary dark:text-slate-400">
              <li>· Hojas duplicadas y versiones contradictorias del stock.</li>
              <li>· Entradas/salidas sin trazabilidad ni responsable claro.</li>
              <li>· Reportes tardíos que llegan cuando el daño ya ocurrió.</li>
            </ul>
          </app-ui-card>
          <app-ui-card>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-accent dark:text-teal-300">Solución</h3>
            <ul class="mt-4 space-y-3 text-sm leading-relaxed text-secondary dark:text-slate-400">
              <li>· Un solo panel con saldos vivos y movimientos auditables.</li>
              <li>· Roles y permisos alineados a tu operación real.</li>
              <li>· Límites y consumo pensados para crecer sin sorpresas.</li>
            </ul>
          </app-ui-card>
        </div>
      </div>
    </section>
  `
})
export class LandingProblemSolutionComponent {}
