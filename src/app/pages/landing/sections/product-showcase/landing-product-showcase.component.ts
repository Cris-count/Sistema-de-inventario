import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { fadeUp } from '../../../../core/animations';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';
import { RevealOnScrollDirective } from '../../../../shared/directives/reveal-on-scroll.directive';
import { GsapHoverDirective } from '../../../../shared/motion/gsap-hover.directive';
import { runWhenVisible, withGsapContext } from '../../../../shared/motion/gsap-motion';

/**
 * Showcase principal del producto.
 *
 * Inspirado en el patrón "mockup + lista de beneficios con check" muy común
 * en landings comerciales (ver referencia interna en `_templete-reference`,
 * Página 4 sección §4). Reconstruido desde cero sobre el sistema visual
 * oficial: tokens, `UiBadge`, `UiButton`, `fadeUp` y `appReveal`. No usa
 * clases globales de la plantilla ni su CSS/JS.
 *
 * Objetivo: después de explicar la solución en texto (`landing-solution`),
 * mostrar visualmente el panel y acompañarlo con una lista clara de lo que
 * el usuario realmente gana. "Tell → Show".
 */
@Component({
  selector: 'app-landing-product-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent, RevealOnScrollDirective, GsapHoverDirective],
  animations: [fadeUp],
  template: `
    <section
      @fadeUp
      id="showcase"
      class="relative overflow-hidden bg-surface py-section dark:bg-slate-900"
      aria-label="Vista del producto"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl dark:bg-accent/20"
      ></div>

      <div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div appReveal class="lg:col-span-7">
            <div
              appGsapHover="media"
              data-gsap-showcase-panel
              class="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-surface p-3 shadow-soft dark:border-slate-600/70 dark:bg-slate-900/85 sm:p-4"
            >
              <img
                src="/landing/showcase-dashboard.svg"
                alt="Representación del panel de inventario con KPIs y movimientos"
                width="960"
                height="600"
                loading="lazy"
                decoding="async"
                class="block h-auto w-full rounded-xl"
              />

              <div class="absolute right-5 top-5 sm:right-6 sm:top-6">
                <app-ui-badge tone="accent" class="!text-[11px]"
                  >Actualizado hace 2 min</app-ui-badge
                >
              </div>
            </div>

            <p class="mt-3 text-xs text-secondary dark:text-slate-500">
              Representación ilustrativa del panel.
            </p>
          </div>

          <div appReveal class="lg:col-span-5">
            <p
              class="text-xs font-semibold uppercase tracking-wider text-accent"
            >
              Así se ve por dentro
            </p>
            <h2
              class="mt-2 text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl"
            >
              Un panel simple, con la información que de verdad usas
            </h2>
            <p class="mt-4 text-base text-secondary dark:text-slate-300">
              Sin pestañas confusas ni reportes que nadie lee. Entras, ves el
              estado de tu inventario y tomas decisiones en minutos.
            </p>

            <ul class="mt-6 space-y-3" role="list">
              @for (item of highlights; track item) {
                <li appGsapHover="subtle" data-gsap-showcase-item class="flex items-start gap-3">
                  <span
                    class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30"
                    aria-hidden="true"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  <span class="text-sm text-primary dark:text-slate-200">{{
                    item
                  }}</span>
                </li>
              }
            </ul>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <app-ui-button appGsapHover="cta" variant="landing-primary" linkTo="/registro"
                >Empieza ahora</app-ui-button
              >
              <app-ui-button
                appGsapHover="subtle"
                variant="landing-secondary"
                (click)="scrollToPlanes()"
                >Ver planes</app-ui-button
              >
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LandingProductShowcaseComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly highlights = [
    'KPIs clave del día: productos, stock bajo y movimientos registrados.',
    'Catálogo ordenado con código, nombre y stock actualizado al instante.',
    'Entradas, salidas y transferencias con responsable y fecha, siempre.',
    'Alertas de stock crítico antes de que se conviertan en un problema.'
  ];

  constructor() {
    afterNextRender(() => this.animateShowcase());
  }

  private animateShowcase(): void {
    let cleanupGsap: (() => void) | undefined;
    let cleanupObserver: (() => void) | undefined;
    let destroyed = false;

    void withGsapContext(this.host.nativeElement, (gsap) => {
      const panel = this.host.nativeElement.querySelector<HTMLElement>('[data-gsap-showcase-panel]');
      const items = gsap.utils.toArray<HTMLElement>('[data-gsap-showcase-item]');

      if (!panel) {
        return;
      }

      gsap.set(panel, { opacity: 0, y: 24, scale: 0.985 });
      gsap.set(items, { opacity: 0, y: 12 });

      cleanupObserver = runWhenVisible(this.host.nativeElement, () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .to(panel, { opacity: 1, y: 0, scale: 1, duration: 0.7, clearProps: 'opacity,transform' }, 0)
          .to(items, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, clearProps: 'opacity,transform' }, 0.18);
      });
    }).then((revert) => {
      cleanupGsap = revert;
      if (destroyed) {
        cleanupObserver?.();
        cleanupGsap();
      }
    });

    this.destroyRef.onDestroy(() => {
      destroyed = true;
      cleanupObserver?.();
      cleanupGsap?.();
    });
  }

  protected scrollToPlanes(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document
      .getElementById('planes')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
