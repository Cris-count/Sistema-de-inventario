import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealOnScrollDirective } from '../../../../shared/directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-landing-urgency',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RevealOnScrollDirective],
  template: `
    <section class="bg-surface py-section-sm dark:bg-slate-900">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8" appReveal>
        <p
          class="text-2xl font-semibold leading-snug tracking-tight text-primary dark:text-slate-100 sm:text-3xl"
        >
          Cada día sin control es dinero que puedes estar perdiendo.
        </p>
        <p class="mt-4 text-base text-secondary dark:text-slate-400 sm:text-lg">
          Empieza hoy y toma el control de tu negocio desde el primer día.
        </p>
      </div>
    </section>
  `
})
export class LandingUrgencyComponent {}
