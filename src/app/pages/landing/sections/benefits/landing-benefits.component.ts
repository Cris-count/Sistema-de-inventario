import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-benefits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-surface py-section">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 class="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              Resultados que tu equipo nota en semanas
            </h2>
            <p class="mt-4 text-lg text-secondary">
              Menos retrabajo, menos reclamos entre áreas y más claridad para comprar y producir con seguridad.
            </p>
          </div>
          <ul class="space-y-4 text-sm leading-relaxed text-secondary">
            @for (b of benefits; track b) {
              <li class="flex gap-3 rounded-2xl border border-slate-200/80 bg-background px-4 py-3">
                <span
                  class="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-50 text-[11px] font-bold text-accent ring-1 ring-teal-100"
                  >&#10003;</span
                >
                <span class="text-primary/90">{{ b }}</span>
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
