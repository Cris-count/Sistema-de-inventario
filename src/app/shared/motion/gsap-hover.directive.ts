import { Directive, DestroyRef, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { prefersReducedMotion } from './gsap-motion';

type HoverVariant = 'cta' | 'card' | 'media' | 'subtle';
type Gsap = typeof import('gsap')['gsap'];

const hoverPresets: Record<
  HoverVariant,
  { y: number; scale: number; pressScale: number; duration: number }
> = {
  cta: { y: -2, scale: 1.015, pressScale: 0.985, duration: 0.22 },
  card: { y: -4, scale: 1.01, pressScale: 0.995, duration: 0.26 },
  media: { y: -3, scale: 1.006, pressScale: 0.998, duration: 0.3 },
  subtle: { y: -1, scale: 1.006, pressScale: 0.992, duration: 0.2 }
};

@Directive({
  selector: '[appGsapHover]'
})
export class GsapHoverDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly appGsapHover = input<HoverVariant>('subtle');

  constructor() {
    afterNextRender(() => this.init());
  }

  private init(): void {
    if (prefersReducedMotion()) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let destroyed = false;

    void import('gsap').then(({ gsap }) => {
      if (destroyed) {
        return;
      }

      const target = this.resolveTarget();
      const context = gsap.context(() => this.bindInteractions(gsap, target), this.host.nativeElement);
      cleanup = () => context.revert();
    });

    this.destroyRef.onDestroy(() => {
      destroyed = true;
      cleanup?.();
    });
  }

  private resolveTarget(): HTMLElement {
    return this.host.nativeElement.querySelector<HTMLElement>('button, a') ?? this.host.nativeElement;
  }

  private bindInteractions(gsap: Gsap, target: HTMLElement): void {
    const preset = hoverPresets[this.appGsapHover()];
    const hover = () => {
      gsap.to(target, {
        y: preset.y,
        scale: preset.scale,
        duration: preset.duration,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };
    const reset = () => {
      gsap.to(target, {
        y: 0,
        scale: 1,
        duration: 0.24,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'transform'
      });
    };
    const press = () => {
      gsap.to(target, {
        y: 0,
        scale: preset.pressScale,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    target.addEventListener('pointerenter', hover);
    target.addEventListener('pointerleave', reset);
    target.addEventListener('pointerdown', press);
    target.addEventListener('pointerup', hover);
    target.addEventListener('focusin', hover);
    target.addEventListener('focusout', reset);

    this.destroyRef.onDestroy(() => {
      target.removeEventListener('pointerenter', hover);
      target.removeEventListener('pointerleave', reset);
      target.removeEventListener('pointerdown', press);
      target.removeEventListener('pointerup', hover);
      target.removeEventListener('focusin', hover);
      target.removeEventListener('focusout', reset);
    });
  }
}
