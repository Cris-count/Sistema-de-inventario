import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  numberAttribute
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Revela un elemento cuando entra en el viewport. Pensado para la landing pública.
 *
 * Diseño:
 * - Aplica la clase `.lp-reveal` al inicializarse (estado oculto definido en `landing-styles.css`).
 * - En navegador, usa un único `IntersectionObserver` para añadir `.lp-reveal-in` al intersectar.
 * - En servidor (SSR) no hace nada: el elemento se renderiza oculto (opacity 0) y se revelará
 *   cuando hidrate. Para contenido SEO-crítico, el texto igualmente está en el DOM.
 * - Respeta `prefers-reduced-motion`: el CSS neutraliza el estado oculto y la transición.
 * - `[revealDelay]` añade un retraso opcional (stagger manual) en milisegundos.
 *
 * Uso:
 *   <section appReveal>...</section>
 *   <article appReveal [revealDelay]="120">...</article>
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'lp-reveal',
    '[style.--lp-reveal-delay]': 'delayVar()'
  }
})
export class RevealOnScrollDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Retraso adicional de entrada en ms (para stagger manual). */
  readonly revealDelay = input<number, string | number>(0, { transform: numberAttribute });

  protected readonly delayVar = (): string => `${this.revealDelay()}ms`;

  constructor() {
    afterNextRender(() => this.observe());
  }

  private observe(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const el = this.host.nativeElement;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('lp-reveal-in');
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('lp-reveal-in');
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
  }
}
