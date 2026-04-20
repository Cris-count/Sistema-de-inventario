import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';

@Component({
  selector: 'app-landing-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent],
  template: `
    <section
      id="producto"
      class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 text-slate-50"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(45,212,191,0.35),transparent)]"
      ></div>
      <div
        class="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
      ></div>

      <div
        class="relative mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24 lp-hero-pad"
      >
        <div class="lp-fade-up max-w-xl">
          <app-ui-badge tone="accent" class="!bg-white/10 !text-teal-100 !ring-white/10"
            >Inventario en tiempo real</app-ui-badge
          >
          <h1
            class="mt-5 text-[1.65rem] font-semibold leading-[1.2] tracking-tight text-white sm:text-4xl sm:leading-[1.15] lg:text-[3.25rem] lg:leading-[1.08]"
          >
            Controla stock, bodegas y movimientos sin hojas de cálculo.
          </h1>
          <p class="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            Un panel claro para equipos que necesitan precisión operativa: entradas, salidas,
            transferencias y trazabilidad — con roles y límites listos para escalar.
          </p>
          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <app-ui-button variant="landing-primary" class="w-full sm:w-auto" linkTo="/registro"
              >Empezar gratis</app-ui-button
            >
            <app-ui-button
              variant="landing-secondary"
              class="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/15 sm:w-auto"
              linkTo="/login"
              >Iniciar sesión</app-ui-button
            >
          </div>
          <p class="mt-4 text-xs text-slate-400">Sin tarjeta para explorar · Migración guiada disponible</p>
        </div>

        <div class="lp-fade-up lp-delay-1 relative">
          <div
            class="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl shadow-teal-900/40 backdrop-blur"
          >
            <div class="rounded-xl bg-surface p-4 shadow-inner ring-1 ring-slate-200/60">
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-red-400/90"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-amber-400/90"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-400/90"></span>
                </div>
                <span class="text-xs font-medium text-secondary">app / dashboard</span>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-secondary">Existencias</p>
                  <p class="mt-1 text-2xl font-semibold text-slate-900">12.4k</p>
                  <p class="text-xs text-accent">+3.1% vs. mes</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-secondary">Alertas</p>
                  <p class="mt-1 text-2xl font-semibold text-slate-900">18</p>
                  <p class="text-xs text-amber-700">Stock mínimo</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-secondary">Movimientos</p>
                  <p class="mt-1 text-2xl font-semibold text-slate-900">642</p>
                  <p class="text-xs text-secondary">Últimos 7 días</p>
                </div>
              </div>
              <div class="mt-4 rounded-lg border border-slate-100 bg-white">
                <div class="grid grid-cols-4 gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                  <span>SKU</span>
                  <span class="col-span-2">Producto</span>
                  <span class="text-right">Qty</span>
                </div>
                @for (row of rows; track row.sku) {
                  <div
                    class="grid grid-cols-4 gap-2 px-3 py-2.5 text-xs text-slate-900 odd:bg-white even:bg-slate-50/50"
                  >
                    <span class="font-mono text-secondary">{{ row.sku }}</span>
                    <span class="col-span-2">{{ row.name }}</span>
                    <span class="text-right font-medium">{{ row.qty }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `
  ]
})
export class LandingHeroComponent {
  readonly rows = [
    { sku: 'SKU-2041', name: 'Tornillería M6', qty: '240' },
    { sku: 'SKU-1188', name: 'Empaque térmico', qty: '92' },
    { sku: 'SKU-0092', name: 'Sensor NTC', qty: '15' }
  ];
}
