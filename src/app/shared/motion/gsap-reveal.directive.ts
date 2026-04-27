import {
  Directive,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  numberAttribute
} from '@angular/core';
import { runWhenVisible, withGsapContext } from './gsap-motion';

type RevealVariant = 'section' | 'cards' | 'media' | 'cta';

const revealPresets: Record<
  RevealVariant,
  { y: number; scale?: number; duration: number; stagger: number }
> = {
  section: { y: 18, duration: 0.62, stagger: 0.06 },
  cards: { y: 20, scale: 0.985, duration: 0.58, stagger: 0.055 },
  media: { y: 26, scale: 0.985, duration: 0.72, stagger: 0.08 },
  cta: { y: 18, scale: 0.99, duration: 0.64, stagger: 0.06 }
};

@Directive({
  selector: '[appGsapReveal]'
})
export class GsapRevealDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly appGsapReveal = input<RevealVariant>('section');
  readonly gsapRevealTargets = input<string>('');
  readonly gsapRevealDelay = input<number, string | number>(0, { transform: numberAttribute });

  constructor() {
    afterNextRender(() => this.init());
  }

  private init(): void {
    let cleanupGsap: (() => void) | undefined;
    let cleanupObserver: (() => void) | undefined;
    let destroyed = false;

    void withGsapContext(this.host.nativeElement, (gsap) => {
      const preset = revealPresets[this.appGsapReveal()];
      const selector = this.gsapRevealTargets();
      const targets = selector
        ? Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(selector))
        : [this.host.nativeElement];

      if (targets.length === 0) {
        return;
      }

      gsap.set(targets, {
        opacity: 0,
        y: preset.y,
        scale: preset.scale ?? 1
      });

      cleanupObserver = runWhenVisible(this.host.nativeElement, () => {
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          scale: 1,
          delay: this.gsapRevealDelay() / 1000,
          duration: preset.duration,
          stagger: preset.stagger,
          ease: 'power3.out',
          clearProps: 'opacity,transform'
        });
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
}
