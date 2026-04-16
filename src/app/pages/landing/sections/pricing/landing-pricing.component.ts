import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';

@Component({
  selector: 'app-landing-pricing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent],
  template: `
    <section id="planes" class="bg-background py-section">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Planes claros, sin letra pequeña</h2>
          <p class="mt-4 text-lg text-secondary">
            Valores orientativos para lanzamiento. Ajusta copy y montos cuando conectes pagos reales.
          </p>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-3">
          @for (p of plans; track p.codigo) {
            <article
              [class]="
                'relative flex flex-col rounded-2xl border bg-surface p-6 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-md ' +
                (p.highlight ? 'border-teal-200 ring-2 ring-teal-100' : 'border-slate-200/80')
              "
            >
              @if (p.highlight) {
                <app-ui-badge tone="accent" class="absolute -top-3 left-1/2 -translate-x-1/2"
                  >Recomendado</app-ui-badge
                >
              }
              <h3 class="text-lg font-semibold text-primary">{{ p.name }}</h3>
              <p class="mt-2 text-sm text-secondary">{{ p.blurb }}</p>
              <p class="mt-6 flex items-baseline gap-1">
                <span class="text-4xl font-semibold tracking-tight text-primary">{{ p.price }}</span>
                <span class="text-sm text-secondary">{{ p.cadence }}</span>
              </p>
              <ul class="mt-6 space-y-2 text-sm text-secondary">
                @for (f of p.features; track f) {
                  <li class="flex gap-2">
                    <span class="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent"></span>
                    <span>{{ f }}</span>
                  </li>
                }
              </ul>
              <div class="mt-8">
                <app-ui-button
                  [variant]="p.highlight ? 'gradient' : 'secondary'"
                  class="w-full"
                  to="/registro"
                  [queryParams]="{ plan: p.codigo }"
                  >{{ p.cta }}</app-ui-button
                >
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingPricingComponent {
   readonly plans = [
    {
      codigo: 'STARTER',
      name: 'Starter',
      blurb: 'Para equipos que están ordenando el inventario por primera vez.',
      price: 'USD 29',
      cadence: '/mes',
      cta: 'Comenzar',
      highlight: false,
      features: ['Hasta 2 bodegas', 'Usuarios esenciales', 'Movimientos ilimitados en rango base', 'Soporte por correo']
    },
    {
      codigo: 'PROFESIONAL',
      name: 'Profesional',
      blurb: 'El punto dulce para operaciones con varias ubicaciones y roles.',
      price: 'USD 79',
      cadence: '/mes',
      cta: 'Elegir Profesional',
      highlight: true,
      features: [
        'Bodegas extendidas',
        'Roles avanzados (admin/bodega/compras)',
        'Reportes kardex y exportación',
        'Límites de consumo configurables'
      ]
    },
    {
      codigo: 'EMPRESA',
      name: 'Empresa',
      blurb: 'Para multi-sede, integraciones y acompañamiento cercano.',
      price: 'A medida',
      cadence: '',
      cta: 'Hablar con ventas',
      highlight: false,
      features: ['SSO / integraciones (roadmap)', 'SLA prioritario', 'Ambientes y políticas avanzadas', 'Customer success dedicado']
    }
  ];
}
