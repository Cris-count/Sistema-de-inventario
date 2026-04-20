import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';
import { fadeUp, staggerList } from '../../../../core/animations';

@Component({
  selector: 'app-landing-problem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  animations: [fadeUp, staggerList],
  template: `
    <section id="problema" class="bg-background py-section dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div @fadeUp class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
            El desorden en tu inventario te está costando dinero
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Si manejas tu inventario con Excel, cuadernos o mensajes de WhatsApp, los errores se acumulan
            y terminan afectando tus ingresos, tu tiempo y tus decisiones.
          </p>
        </div>

        <div @staggerList class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (p of problems; track p.title) {
            <app-ui-card class="lp-card-hover h-full">
              <h3 class="text-base font-semibold text-primary dark:text-slate-100">{{ p.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-secondary dark:text-slate-400">{{ p.body }}</p>
            </app-ui-card>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingProblemComponent {
  readonly problems = [
    {
      title: 'Productos perdidos o mal registrados',
      body: 'Referencias que aparecen y desaparecen, saldos que nadie puede explicar y plata que se escapa en silencio.'
    },
    {
      title: 'Entradas y salidas sin control',
      body: 'Movimientos en papeles sueltos o chats, sin responsable claro y sin forma de revisar qué pasó realmente.'
    },
    {
      title: 'Decisiones tomadas a ciegas',
      body: 'Compras al cálculo, ventas sin saber qué hay disponible y reportes que llegan cuando el problema ya ocurrió.'
    }
  ];
}
