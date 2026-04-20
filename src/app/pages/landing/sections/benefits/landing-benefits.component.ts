import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeUp, staggerList } from '../../../../core/animations';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

interface BenefitItem {
  title: string;
  body: string;
}

@Component({
  selector: 'app-landing-benefits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  animations: [fadeUp, staggerList],
  template: `
    <section id="beneficios" class="bg-background py-section dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div @fadeUp class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
            Lo que realmente ganas
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            No es solo tener un sistema. Es ganar control, tiempo y claridad para decidir mejor cada día.
          </p>
        </div>

        <div @staggerList class="mt-12 grid gap-5 sm:grid-cols-2">
          @for (b of benefits; track b.title) {
            <app-ui-card class="lp-card-hover flex gap-4">
              <span
                class="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30"
                aria-hidden="true"
                >&#10003;</span
              >
              <div>
                <h3 class="text-base font-semibold text-primary dark:text-slate-100">{{ b.title }}</h3>
                <p class="mt-1 text-sm leading-relaxed text-secondary dark:text-slate-400">{{ b.body }}</p>
              </div>
            </app-ui-card>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingBenefitsComponent {
  readonly benefits: BenefitItem[] = [
    {
      title: 'Evitas pérdidas por desorden',
      body: 'Productos registrados, movimientos claros y menos plata que se escapa sin explicación.'
    },
    {
      title: 'Ahorras tiempo operativo',
      body: 'Tu equipo deja de revisar Excel, cuadernos y chats. Todo queda en un solo lugar ordenado.'
    },
    {
      title: 'Tomas decisiones con datos reales',
      body: 'Compras, ventas y reposición basadas en el stock que sí tienes, no en suposiciones.'
    },
    {
      title: 'Escalas sin perder el control',
      body: 'Más productos, más bodegas y más personas en tu negocio, con la misma claridad del primer día.'
    }
  ];
}
