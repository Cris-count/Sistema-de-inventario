type Gsap = typeof import('gsap')['gsap'];

const noop = (): void => {};

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function withGsapContext(
  scope: HTMLElement,
  setup: (gsap: Gsap) => void
): Promise<() => void> {
  if (prefersReducedMotion()) {
    return noop;
  }

  const { gsap } = await import('gsap');
  const context = gsap.context(() => setup(gsap), scope);
  return () => context.revert();
}

export function runWhenVisible(
  element: HTMLElement,
  onVisible: () => void,
  options: IntersectionObserverInit = { rootMargin: '0px 0px -12% 0px', threshold: 0.18 }
): () => void {
  if (prefersReducedMotion()) {
    return noop;
  }

  if (typeof IntersectionObserver === 'undefined') {
    onVisible();
    return noop;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        onVisible();
        obs.disconnect();
        break;
      }
    }
  }, options);

  observer.observe(element);
  return () => observer.disconnect();
}
