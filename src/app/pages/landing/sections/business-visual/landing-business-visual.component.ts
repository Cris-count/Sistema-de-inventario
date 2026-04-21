import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  afterNextRender,
  inject,
  PLATFORM_ID,
  signal
} from '@angular/core';

interface LandingPanelSlide {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly imageSrc: string;
  readonly imageAlt: string;
}

/**
 * Sección «Panel» (#panel): carrusel de capturas reales disponibles en `/public/landing/`.
 * Navegación manual prioritaria; autoplay lento solo si no hay `prefers-reduced-motion`.
 */
@Component({
  selector: 'app-landing-business-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="panel"
      class="relative scroll-mt-24 overflow-hidden border-y border-slate-800/80 bg-slate-950 py-section-lg text-slate-100"
      aria-labelledby="panel-heading"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,118,110,0.06)_50%,rgba(15,23,42,0)_100%)]"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-teal-400/90">Panel</p>
          <h2
            id="panel-heading"
            class="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight"
          >
            El sistema en acción, pantalla a pantalla
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
            Vistas reales del producto: operación diaria, inventario, movimientos y más. Navega con los controles o los
            indicadores.
          </p>
        </div>

        <div class="relative mt-12 lg:mt-14">
          <div
            class="relative overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)] ring-1 ring-white/5 sm:rounded-[1.35rem]"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-900/95 px-4 py-3 sm:px-6"
            >
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full bg-red-500/90"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-amber-400/90"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-emerald-500/90"></span>
              </div>
              <p class="text-xs font-semibold text-slate-400">
                <span class="text-slate-500">Vista ·</span>
                {{ activeSlide().title }}
              </p>
              <span
                class="hidden rounded-md border border-teal-500/40 bg-teal-950/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-200/95 sm:inline"
                >Captura</span
              >
            </div>

            <div class="relative bg-slate-950 p-3 sm:p-5 lg:p-6">
              <div class="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 ring-1 ring-slate-800/80">
                <div
                  class="lp-panel-carousel__track flex transition-transform duration-500 ease-out"
                  [style.transform]="'translateX(-' + currentIndex() * 100 + '%)'"
                  role="region"
                  [attr.aria-label]="'Capturas del producto, vista ' + (currentIndex() + 1) + ' de ' + slides.length"
                >
                  @for (slide of slides; track slide.id) {
                    <div class="w-full shrink-0 px-1 sm:px-2">
                      <figure class="m-0">
                        <img
                          [src]="slide.imageSrc"
                          [alt]="slide.imageAlt"
                          width="1200"
                          height="675"
                          loading="lazy"
                          decoding="async"
                          class="h-auto w-full object-cover object-top"
                        />
                        <figcaption
                          class="border-t border-slate-800 bg-slate-900/90 px-4 py-3 text-left sm:px-5 sm:py-4"
                        >
                          <p class="text-sm font-semibold text-white sm:text-base">{{ slide.title }}</p>
                          <p class="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">{{ slide.description }}</p>
                        </figcaption>
                      </figure>
                    </div>
                  }
                </div>
              </div>

              <div class="mt-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex justify-center gap-2 sm:justify-start" role="tablist" aria-label="Seleccionar vista">
                  @for (slide of slides; track slide.id; let i = $index) {
                    <button
                      type="button"
                      class="h-2.5 min-w-2.5 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                      [class]="
                        i === currentIndex()
                          ? 'w-8 bg-teal-400'
                          : 'w-2.5 bg-slate-600 hover:bg-slate-500'
                      "
                      [attr.aria-label]="'Mostrar: ' + slide.title"
                      [attr.aria-selected]="i === currentIndex()"
                      (click)="goTo(i)"
                    ></button>
                  }
                </div>
                <div class="flex items-center justify-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-200 transition hover:border-teal-500/50 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                    aria-label="Vista anterior"
                    (click)="prev()"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M15 6L9 12l6 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-slate-200 transition hover:border-teal-500/50 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                    aria-label="Vista siguiente"
                    (click)="next()"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    @media (prefers-reduced-motion: reduce) {
      .lp-panel-carousel__track {
        transition: none !important;
      }
    }
  `
})
export class LandingBusinessVisualComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly slides: readonly LandingPanelSlide[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Resumen operativo: métricas y estado del negocio para decidir con datos al día.',
      imageSrc: '/landing/showcase-dashboard.svg',
      imageAlt: 'Captura del panel principal con métricas y vista general del inventario'
    },
    {
      id: 'inventario',
      title: 'Inventario',
      description: 'Consulta existencias por producto, bodega o ubicación en una sola vista.',
      imageSrc: '/landing/showcase-productos.svg',
      imageAlt: 'Captura de la vista de inventario y catálogo de productos'
    },
    {
      id: 'movimientos',
      title: 'Movimientos',
      description: 'Entradas, salidas y trazabilidad del stock en el día a día.',
      imageSrc: '/landing/showcase-movimientos.svg',
      imageAlt: 'Captura del registro y seguimiento de movimientos de inventario'
    },
    {
      id: 'reportes',
      title: 'Reportes',
      description: 'Kardex, exportación y lectura para auditoría y decisiones (según tu plan).',
      imageSrc: '/landing/showcase-dashboard.svg',
      imageAlt: 'Vista ilustrativa alineada a reportes y lectura de operación'
    },
    {
      id: 'bodegas',
      title: 'Bodegas',
      description: 'Organiza el stock por sedes o puntos operativos.',
      imageSrc: '/landing/showcase-productos.svg',
      imageAlt: 'Vista ilustrativa de organización por bodegas y existencias'
    },
    {
      id: 'alertas',
      title: 'Alertas',
      description: 'Detecta productos bajo mínimo y prioriza reposición.',
      imageSrc: '/landing/showcase-dashboard.svg',
      imageAlt: 'Vista ilustrativa con foco en alertas y umbrales de stock'
    }
  ];

  readonly currentIndex = signal(0);
  readonly activeSlide = computed(() => this.slides[this.currentIndex()]);

  private autoplayId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const reduce =
        typeof globalThis.matchMedia === 'function' &&
        globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      this.autoplayId = globalThis.setInterval(() => this.next(), 10000);
    });
    this.destroyRef.onDestroy(() => {
      if (this.autoplayId != null) {
        globalThis.clearInterval(this.autoplayId);
        this.autoplayId = null;
      }
    });
  }

  goTo(i: number): void {
    const n = this.slides.length;
    const idx = ((i % n) + n) % n;
    this.currentIndex.set(idx);
  }

  next(): void {
    this.goTo(this.currentIndex() + 1);
  }

  prev(): void {
    this.goTo(this.currentIndex() - 1);
  }
}
