import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RevealOnScrollDirective } from '../../../../shared/directives/reveal-on-scroll.directive';

type PillarIcon = 'inventory' | 'sales' | 'catalog' | 'reports';

interface Pillar {
  title: string;
  body: string;
  tagline: string;
  icon: PillarIcon;
}

/**
 * Pilares de producto (#como-funciona). Desktop: grid 4 cols; &lt;xl: carrusel scroll-snap + controles discretos.
 */
@Component({
  selector: 'app-landing-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealOnScrollDirective],
  template: `
    <section
      id="como-funciona"
      class="lp-how-section scroll-mt-24 border-b border-slate-200/60 bg-linear-to-b from-white via-slate-50/90 to-slate-100/80 py-section-lg dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-labelledby="como-funciona-heading"
    >
      <div class="relative z-[1] mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-3xl text-center">
          <p
            appReveal
            [revealDelay]="0"
            class="text-xs font-bold uppercase tracking-[0.22em] text-accent dark:text-teal-400"
          >
            CONTROL TOTAL
          </p>
          <h2
            appReveal
            [revealDelay]="70"
            id="como-funciona-heading"
            class="mt-4 text-4xl font-bold tracking-tight text-primary dark:text-slate-100 sm:text-5xl"
          >
            Lo esencial para operar con más orden y más control
          </h2>
          <p
            appReveal
            [revealDelay]="140"
            class="mt-4 text-lg leading-relaxed text-secondary dark:text-slate-400 sm:text-xl"
          >
            Centraliza inventario, movimientos, productos y reportes en una sola plataforma pensada para el día a día
            de tu negocio.
          </p>
        </div>

        <div
          class="mt-14 xl:mt-16"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Pilares del producto"
          tabindex="0"
          (keydown)="onCarouselKeydown($event)"
        >
          <div
            #carouselTrack
            class="lp-how-carousel lp-stagger flex gap-4 overflow-x-auto pb-1 pt-0.5 sm:gap-5 xl:grid xl:grid-cols-4 xl:gap-8 xl:overflow-visible xl:pb-0 xl:snap-none"
            (scroll)="onCarouselScroll()"
          >
            @for (pillar of pillars; track pillar.title; let i = $index) {
              <article
                #pillarCard
                appReveal
                class="lp-how-card-reveal lp-how-pillar group relative flex min-h-full w-[min(22rem,calc(100vw-2.75rem))] max-xl:snap-center shrink-0 flex-col rounded-2xl border border-slate-200/85 bg-white/95 p-6 backdrop-blur-sm dark:border-slate-700/85 dark:bg-slate-900/92 sm:w-[min(21rem,calc(100vw-3.5rem))] md:w-[min(20rem,42vw)] xl:min-h-0 xl:w-auto xl:min-w-0 xl:p-7"
              >
                <div
                  class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-teal-50 to-emerald-50 text-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] ring-2 ring-teal-100/90 dark:from-teal-950/90 dark:to-slate-900 dark:text-teal-300 dark:ring-teal-800/55"
                  aria-hidden="true"
                >
                  @switch (pillar.icon) {
                    @case ('inventory') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.55"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                        />
                        <path d="M3.3 7 12 12l8.7-5M12 22V12" />
                      </svg>
                    }
                    @case ('sales') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.55"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 3 4 7l4 4" />
                        <path d="M4 7h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                      </svg>
                    }
                    @case ('catalog') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.55"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.94-1.51L23 6H6" />
                      </svg>
                    }
                    @case ('reports') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.55"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                        <path d="m7 11 4 4 4-8" />
                        <path d="M7 17h10" />
                      </svg>
                    }
                  }
                </div>

                <h3 class="text-xl font-bold leading-snug tracking-tight text-primary dark:text-slate-100">
                  {{ pillar.title }}
                </h3>
                <p class="mt-3 flex-1 text-base leading-relaxed text-secondary dark:text-slate-400">
                  {{ pillar.body }}
                </p>
                <p
                  class="mt-5 border-t border-slate-200/90 pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent dark:border-slate-700/90 dark:text-accent/90"
                >
                  {{ pillar.tagline }}
                </p>
              </article>
            }
          </div>

          <div
            class="mt-6 flex items-center justify-center gap-3 xl:hidden"
            aria-hidden="false"
          >
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-primary shadow-sm transition hover:border-teal-300/60 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-teal-600/50 dark:hover:bg-slate-800"
              [disabled]="activeSlide() <= 0"
              (click)="scrollStep(-1)"
              aria-label="Anterior"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div class="flex items-center gap-2 px-1" role="group" aria-label="Ir a un pilar">
              @for (pillar of pillars; track pillar.title; let i = $index) {
                <button
                  type="button"
                  class="h-2 rounded-full transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  [class]="
                    activeSlide() === i
                      ? 'w-8 bg-accent shadow-sm shadow-teal-900/15'
                      : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'
                  "
                  [attr.aria-current]="activeSlide() === i ? 'true' : null"
                  [attr.aria-label]="'Ver: ' + pillar.title"
                  (click)="scrollToIndex(i)"
                ></button>
              }
            </div>
            <button
              type="button"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-primary shadow-sm transition hover:border-teal-300/60 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-teal-600/50 dark:hover:bg-slate-800"
              [disabled]="activeSlide() >= pillars.length - 1"
              (click)="scrollStep(1)"
              aria-label="Siguiente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LandingHowItWorksComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly carouselTrack = viewChild<ElementRef<HTMLElement>>('carouselTrack');
  private readonly pillarCards = viewChildren<ElementRef<HTMLElement>>('pillarCard');

  /** Índice del pilar más visible en el carrusel (&lt;xl). */
  readonly activeSlide = signal(0);

  /** Respeta prefers-reduced-motion (sin scroll suave; mismo contenido). */
  readonly reduceMotion = signal(false);

  readonly pillars: readonly Pillar[] = [
    {
      title: 'Inventario en tiempo real',
      body:
        'Visualiza existencias, detecta faltantes y entiende qué movimientos afectan tu stock cada día.',
      tagline: 'Stock, alertas y trazabilidad',
      icon: 'inventory'
    },
    {
      title: 'Ventas y movimientos',
      body:
        'Registra entradas, salidas y actividad operativa con más claridad, menos errores y mejor seguimiento.',
      tagline: 'Entradas, salidas y control',
      icon: 'sales'
    },
    {
      title: 'Compras y productos',
      body:
        'Mantén orden sobre catálogo, abastecimiento y cambios de inventario en un flujo mucho más simple.',
      tagline: 'Catálogo y abastecimiento',
      icon: 'catalog'
    },
    {
      title: 'Reportes claros',
      body:
        'Consulta reportes que te muestran qué se mueve más, qué necesita atención y cómo va tu operación.',
      tagline: 'Visibilidad para decidir',
      icon: 'reports'
    }
  ];

  private scrollRaf = 0;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reduceMotion.set(mq.matches);
      mq.addEventListener('change', () => this.reduceMotion.set(mq.matches));
    });
  }

  protected onCarouselKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      this.scrollStep(-1);
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      this.scrollStep(1);
    }
  }

  protected onCarouselScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.scrollRaf) {
      return;
    }
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      this.syncActiveFromScroll();
    });
  }

  protected scrollStep(dir: -1 | 1): void {
    const next = Math.max(0, Math.min(this.pillars.length - 1, this.activeSlide() + dir));
    this.scrollToIndex(next);
  }

  protected scrollToIndex(i: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const track = this.carouselTrack()?.nativeElement;
    const card = this.pillarCards()?.[i]?.nativeElement;
    if (!track || !card) {
      return;
    }
    const behavior: ScrollBehavior = this.reduceMotion() ? 'auto' : 'smooth';
    const left = card.offsetLeft - track.offsetLeft;
    track.scrollTo({ left, behavior });
    this.activeSlide.set(i);
  }

  private syncActiveFromScroll(): void {
    const track = this.carouselTrack()?.nativeElement;
    const cards = this.pillarCards();
    if (!track || !cards?.length) {
      return;
    }
    if (track.scrollWidth <= track.clientWidth + 2) {
      this.activeSlide.set(0);
      return;
    }
    const probe = track.scrollLeft + track.clientWidth * 0.28;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((ref, i) => {
      const el = ref.nativeElement;
      const left = el.offsetLeft - track.offsetLeft;
      const dist = Math.abs(left - probe);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    this.activeSlide.set(best);
  }
}
