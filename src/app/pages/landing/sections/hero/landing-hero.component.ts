import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';
import { fadeUp } from '../../../../core/animations';

@Component({
  selector: 'app-landing-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent],
  animations: [fadeUp],
  template: `
    <section
      @fadeUp
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

      <div class="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div class="max-w-xl">
          <app-ui-badge tone="on-dark"
            >Diseñado para pymes que quieren crecer con control</app-ui-badge
          >
          <h1 class="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            Deja de perder dinero por desorden en tu inventario
          </h1>
          <p class="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
            Controla tus productos, movimientos y stock en un solo lugar claro y fácil de usar.
          </p>
          <p class="mt-3 text-base font-medium text-teal-200 sm:text-lg">
            Menos errores, más control, mejores decisiones.
          </p>
          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <app-ui-button variant="landing-primary" class="w-full sm:w-auto" linkTo="/registro"
              >Empieza gratis</app-ui-button
            >
            <app-ui-button
              variant="landing-secondary"
              class="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/15 sm:w-auto"
              (click)="scrollToPlanes()"
              >Ver planes</app-ui-button
            >
          </div>
          <p class="mt-4 text-xs text-slate-400">Empieza sin costo · Organiza tu inventario desde el primer día</p>
        </div>

        <div class="relative">
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
                <span class="text-xs font-medium text-secondary">Tu panel de inventario</span>
              </div>
              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-secondary">Productos</p>
                  <p class="mt-1 text-2xl font-semibold text-slate-900">342</p>
                  <p class="text-xs text-secondary">Catálogo organizado</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-secondary">Stock bajo</p>
                  <p class="mt-1 text-2xl font-semibold text-slate-900">6</p>
                  <p class="text-xs text-amber-700">Necesita reposición</p>
                </div>
                <div class="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-secondary">Movimientos hoy</p>
                  <p class="mt-1 text-2xl font-semibold text-slate-900">28</p>
                  <p class="text-xs text-accent">Todo registrado</p>
                </div>
              </div>
              <div class="mt-4 rounded-lg border border-slate-100 bg-white">
                <div class="grid grid-cols-4 gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                  <span>Código</span>
                  <span class="col-span-2">Producto</span>
                  <span class="text-right">Stock</span>
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
    { sku: 'P-001', name: 'Producto A', qty: '120' },
    { sku: 'P-014', name: 'Producto B', qty: '48' },
    { sku: 'P-027', name: 'Producto C', qty: '15' }
  ];

  protected scrollToPlanes(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
