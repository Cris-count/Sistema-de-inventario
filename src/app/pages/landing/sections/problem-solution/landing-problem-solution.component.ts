import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

@Component({
  selector: 'app-landing-problem-solution',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  template: `
    <section
      id="problema"
      class="scroll-mt-24 bg-white py-section-lg dark:bg-slate-950"
    >
      <div class="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 lp-section-pad">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="text-4xl font-bold tracking-tight text-primary dark:text-slate-100 sm:text-5xl">
            Pensado para negocios que necesitan orden todos los días
          </h2>
          <p class="mt-4 text-lg leading-relaxed text-secondary dark:text-slate-400 sm:text-xl">
            Ideal para tiendas, bodegas, papelerías, ferreterías, repuestos y otros negocios que necesitan controlar
            inventario, ventas y movimientos en un solo lugar.
          </p>
        </div>

        <div class="mt-14 grid gap-8 lg:grid-cols-2">
          <app-ui-card
            [class]="
              'rounded-2xl border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-rose-900/50 dark:from-rose-950/30 dark:to-slate-900'
            "
          >
            <h3 class="text-sm font-bold leading-snug text-rose-800 dark:text-rose-200">
              Lo que suele pasar sin control claro
            </h3>
            <ul class="mt-5 space-y-3 text-base leading-relaxed text-secondary dark:text-slate-400">
              <li>· No sabes con certeza qué productos quedan disponibles.</li>
              <li>· Se pierden movimientos entre compras, ventas y ajustes.</li>
              <li>· Cuesta detectar qué necesita reposición.</li>
              <li>· La información se reparte entre varias personas o herramientas.</li>
              <li>· Tomar decisiones diarias se vuelve más lento.</li>
            </ul>
          </app-ui-card>
          <app-ui-card
            [class]="
              'rounded-2xl border-teal-200/60 bg-gradient-to-br from-teal-50/80 to-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:border-teal-800/50 dark:from-teal-950/25 dark:to-slate-900'
            "
          >
            <h3 class="text-sm font-bold leading-snug text-accent dark:text-teal-300">
              Lo que puedes hacer con Inventario Pro
            </h3>
            <ul class="mt-5 space-y-3 text-base leading-relaxed text-secondary dark:text-slate-400">
              <li>· Consultar existencias y movimientos en tiempo real.</li>
              <li>· Tener inventario, ventas y compras centralizados.</li>
              <li>· Detectar productos con stock bajo más rápido.</li>
              <li>· Trabajar con más orden y menos errores.</li>
              <li>· Revisar reportes claros para decidir mejor.</li>
            </ul>
          </app-ui-card>
        </div>
      </div>
    </section>
  `
})
export class LandingProblemSolutionComponent {}
