import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';

@Component({
  selector: 'app-landing-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent],
  template: `
    <section id="producto" class="lp-hero relative overflow-hidden text-slate-50">
      <div class="lp-hero-bg" aria-hidden="true"></div>
      <div class="lp-hero-right-glow" aria-hidden="true"></div>
      <div class="lp-hero-grid" aria-hidden="true"></div>
      <div class="lp-hero-vignette" aria-hidden="true"></div>

      <div
        class="relative z-10 mx-auto grid max-w-7xl gap-14 px-5 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(520px,0.95fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-24 lp-hero-pad"
      >
        <div class="max-w-2xl">
          <app-ui-badge
            tone="accent"
            class="!border-white/12 !bg-white/8 !px-3.5 !py-1 !text-sm !font-medium !text-teal-50 !ring-1 !ring-white/8"
          >
            Sistema para PYMES en Colombia
          </app-ui-badge>

          <h1
            class="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl sm:leading-[1.06] lg:text-6xl lg:leading-[1.02]"
          >
            Controla inventario, ventas y compras desde un solo lugar
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            Consulta existencias, registra movimientos, organiza productos y toma decisiones con reportes claros en una
            plataforma hecha para el día a día de tu negocio.
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <app-ui-button variant="gradient" size="lg" to="/registro">Empezar gratis</app-ui-button>
            <app-ui-button
              variant="secondary"
              size="lg"
              class="!border-white/20 !bg-white/10 !text-white hover:!bg-white/15"
              to="/login"
              >Probar gratis</app-ui-button
            >
            <app-ui-button
              variant="landing-on-dark"
              class="w-full sm:w-auto sm:min-w-[220px] !text-base"
              to="/landing"
              fragment="como-funciona"
            >
              Ver cómo funciona
            </app-ui-button>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400 sm:text-[15px]">
            <span>Sin tarjeta</span>
            <span class="h-1 w-1 rounded-full bg-slate-600"></span>
            <span>Configuración rápida</span>
            <span class="h-1 w-1 rounded-full bg-slate-600"></span>
            <span>Hecho para operación real</span>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ventas</p>
              <p class="mt-1 text-sm font-medium leading-snug text-white">Registra y consulta al instante</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Inventario</p>
              <p class="mt-1 text-sm font-medium leading-snug text-white">Controla stock y movimientos</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Reportes</p>
              <p class="mt-1 text-sm font-medium leading-snug text-white">Decide con información clara</p>
            </div>
          </div>
        </div>

        <div class="relative flex justify-center lg:justify-end">
          <div class="lp-hero-panel-wrap relative w-full max-w-2xl">
            <div class="lp-hero-panel-halo" aria-hidden="true"></div>

            <div
              class="relative z-10 overflow-hidden rounded-[2rem] border border-white/12 bg-[#0c1620]/88 p-4 shadow-[0_30px_120px_-28px_rgba(0,0,0,0.75)] ring-1 ring-white/8 backdrop-blur-xl sm:p-5 lg:p-6"
            >
              <div class="rounded-[1.4rem] border border-white/8 bg-white p-5 shadow-inner ring-1 ring-slate-200/70 sm:p-6">
                <div class="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div class="flex items-center gap-2">
                    <span class="h-3 w-3 rounded-full bg-red-400"></span>
                    <span class="h-3 w-3 rounded-full bg-amber-400"></span>
                    <span class="h-3 w-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <span class="text-xs font-semibold tracking-wide text-slate-500 sm:text-sm">panel / operación</span>
                </div>

                <div class="mt-5 grid gap-4 sm:grid-cols-3">
                  <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Ventas hoy</p>
                    <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">$2.8M</p>
                    <p class="mt-1 text-sm font-medium text-emerald-600">+12% frente a ayer</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Stock bajo</p>
                    <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">08</p>
                    <p class="mt-1 text-sm font-medium text-amber-600">Requieren reposición</p>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">Clientes</p>
                    <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">126</p>
                    <p class="mt-1 text-sm text-slate-500">Activos este mes</p>
                  </div>
                </div>

                <div class="mt-5 rounded-2xl border border-slate-200 bg-white">
                  <div
                    class="grid grid-cols-4 gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs"
                  >
                    <span>SKU</span>
                    <span class="col-span-2">Producto</span>
                    <span class="text-right">Qty</span>
                  </div>

                  @for (row of rows; track row.sku) {
                    <div class="grid grid-cols-4 gap-2 px-4 py-3 text-sm text-slate-900 odd:bg-white even:bg-slate-50/70">
                      <span class="font-mono text-xs text-slate-500 sm:text-sm">{{ row.sku }}</span>
                      <span class="col-span-2 font-medium">{{ row.name }}</span>
                      <span class="text-right font-semibold">{{ row.qty }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div
              class="absolute -left-4 top-8 z-20 hidden rounded-2xl border border-teal-300/20 bg-[#0f1c24]/92 px-4 py-3 text-left shadow-[0_20px_60px_-30px_rgba(20,184,166,0.65)] backdrop-blur-md lg:block"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alerta</p>
              <p class="mt-1 text-sm font-semibold text-white">8 productos en stock mínimo</p>
            </div>

            <div
              class="absolute -right-4 bottom-10 z-20 hidden rounded-2xl border border-white/10 bg-[#101923]/92 px-4 py-3 text-left shadow-[0_20px_60px_-30px_rgba(15,23,42,0.75)] backdrop-blur-md lg:block"
            >
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Resumen</p>
              <p class="mt-1 text-sm font-semibold text-white">Compras, ventas y existencias en tiempo real</p>
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
    { sku: 'P-001', name: 'Producto A', qty: '120' },
    { sku: 'P-014', name: 'Producto B', qty: '48' },
    { sku: 'P-027', name: 'Producto C', qty: '15' }
  ];
}
