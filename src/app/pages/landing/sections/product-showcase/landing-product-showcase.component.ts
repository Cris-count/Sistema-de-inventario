import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-product-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-background py-section dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
            Así se ve el sistema por dentro
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Capturas representativas del panel: métricas operativas, catálogo y trazabilidad de movimientos.
            Sustituye estos visuales por screenshots reales cuando quieras máximo realismo.
          </p>
        </div>

        <div class="mt-12 grid gap-6 lg:grid-cols-3">
          @for (s of shots; track s.src) {
            <figure
              class="group overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900"
            >
              <div class="aspect-[16/10] w-full overflow-hidden bg-slate-50 dark:bg-slate-800/80">
                <img
                  [src]="s.src"
                  [alt]="s.alt"
                  width="960"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]"
                />
              </div>
              <figcaption class="border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-700">
                <span class="font-semibold text-primary dark:text-slate-100">{{ s.title }}</span>
                <span class="mt-0.5 block text-secondary dark:text-slate-400">{{ s.caption }}</span>
              </figcaption>
            </figure>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingProductShowcaseComponent {
  readonly shots = [
    {
      src: '/landing/showcase-dashboard.svg',
      alt: 'Representación del dashboard de inventario',
      title: 'Dashboard',
      caption: 'KPIs y salud operativa de un vistazo.'
    },
    {
      src: '/landing/showcase-productos.svg',
      alt: 'Representación del listado de productos',
      title: 'Productos',
      caption: 'Catálogo ordenado, listo para escalar.'
    },
    {
      src: '/landing/showcase-movimientos.svg',
      alt: 'Representación del historial de movimientos',
      title: 'Movimientos',
      caption: 'Entradas, salidas y transferencias trazadas.'
    }
  ];
}
