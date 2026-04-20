import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-benefits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-surface py-section dark:bg-slate-900">
      <div class="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 lp-section-pad">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
              Resultados que tu equipo nota en semanas
            </h2>
            <p class="mt-4 text-lg text-secondary dark:text-slate-400">
              Menos retrabajo, menos reclamos entre áreas y más claridad para comprar y producir con seguridad.
            </p>
          </div>
          <ul class="space-y-4 text-sm leading-relaxed text-secondary dark:text-slate-400">
            @for (b of benefits; track b) {
              <li class="flex gap-3 rounded-2xl border border-slate-200/80 bg-background px-4 py-3 dark:border-slate-700/80 dark:bg-slate-950">
                <span
                  class="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-accent ring-1 ring-teal-100 dark:bg-teal-950/60 dark:ring-teal-800/80"
                  >&#10003;</span
                >
                <span class="text-primary/90 dark:text-slate-200">{{ b }}</span>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `
})
export class LandingBenefitsComponent {
  readonly benefits = [
    'Reduce faltantes y sobrestock con alertas y saldos confiables por bodega.',
    'Acelera cierres con movimientos estandarizados y trazabilidad lista para auditoría.',
    'Escala sin rehacer el proceso: roles, límites y consumo alineados a tu plan.',
    'Onboarding simple: tu equipo entiende el flujo sin manual de 40 páginas.'
  ];
}
