import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-social-proof',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-b border-slate-200/80 bg-background py-section-sm">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p class="text-center text-xs font-semibold uppercase tracking-widest text-secondary">
          Operaciones que necesitan claridad, no caos
        </p>
        <div
          class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8"
          aria-label="Métricas de confianza"
        >
          @for (m of metrics; track m.label) {
            <div class="text-center">
              <p class="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">{{ m.value }}</p>
              <p class="mt-1 text-sm text-secondary">{{ m.label }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingSocialProofComponent {
  readonly metrics = [
    { value: '99.2%', label: 'Precisión en conteos auditados' },
    { value: '<2s', label: 'Tiempo medio de consulta' },
    { value: '24/7', label: 'Disponibilidad del panel' },
    { value: '50+', label: 'Flujos de movimiento soportados' }
  ];
}
