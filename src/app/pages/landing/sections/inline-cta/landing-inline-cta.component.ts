import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';

export type LandingInlineCtaVariant = 'organize' | 'account' | 'free';

@Component({
  selector: 'app-landing-inline-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <section
      class="border-b border-slate-200/60 bg-slate-50 py-8 dark:border-slate-800 dark:bg-slate-950 sm:py-9"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div
          class="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-7 sm:py-6 dark:border-slate-700 dark:bg-slate-900"
        >
          <p
            class="max-w-2xl text-base font-semibold leading-snug text-slate-900 dark:text-slate-100 sm:text-lg"
          >
            {{ headlineText() }}
          </p>
          <div
            class="flex w-full flex-shrink-0 flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3"
          >
            <app-ui-button
              variant="landing-primary"
              class="w-full min-w-0 sm:w-auto"
              linkTo="/registro"
              >{{ primaryLabel() }}</app-ui-button
            >
            @if (showPlansLink()) {
              <app-ui-button
                variant="landing-secondary"
                class="w-full min-w-0 sm:w-auto"
                linkTo="/landing"
                fragment="planes"
                >Ver planes</app-ui-button
              >
            }
          </div>
        </div>
      </div>
    </section>
  `
})
export class LandingInlineCtaComponent {
  readonly variant = input<LandingInlineCtaVariant>('free');
  readonly headline = input<string | undefined>(undefined);
  readonly showPlansLink = input(true);

  protected readonly primaryLabel = computed(() => {
    switch (this.variant()) {
      case 'organize':
        return 'Registrar mi empresa';
      case 'account':
        return 'Crear cuenta';
      default:
        return 'Registrarme gratis';
    }
  });

  protected readonly headlineText = computed(() => {
    const h = this.headline();
    if (h) return h;
    switch (this.variant()) {
      case 'organize':
        return 'Un solo inventario para tu PYME: productos, bodegas y movimientos sin depender de Excel.';
      case 'account':
        return 'Sin tarjeta: empresa, bodegas y primeros movimientos en minutos.';
      default:
        return 'Deja el cuaderno como respaldo: opera con números que todos ven igual.';
    }
  });
}
