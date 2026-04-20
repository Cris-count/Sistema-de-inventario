import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';
import { RevealOnScrollDirective } from '../../../../shared/directives/reveal-on-scroll.directive';

@Component({
  selector: 'app-landing-solution',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent, RevealOnScrollDirective],
  template: `
    <section id="solucion" class="bg-surface py-section dark:bg-slate-900">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center" appReveal>
          <h2 class="text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
            Todo tu inventario en un solo sistema claro
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Un lugar ordenado para que tu negocio deje de depender de hojas sueltas y mensajes. Ves lo que
            tienes, dónde lo tienes y quién lo movió, sin complicaciones.
          </p>
        </div>

        <div class="lp-stagger mt-12 grid gap-6 sm:grid-cols-2">
          @for (s of solutions; track s.title) {
            <app-ui-card appReveal class="lp-card-hover h-full">
              <h3 class="text-base font-semibold text-primary dark:text-slate-100">{{ s.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-secondary dark:text-slate-400">{{ s.body }}</p>
            </app-ui-card>
          }
        </div>

        <p
          appReveal
          class="mx-auto mt-12 max-w-2xl text-center text-base text-secondary dark:text-slate-400"
        >
          Toda la información que necesitas, en el momento que la necesitas.
        </p>
      </div>
    </section>
  `
})
export class LandingSolutionComponent {
  readonly solutions = [
    {
      title: 'Registra tus productos en minutos',
      body: 'Organiza tu catálogo con nombres, códigos y categorías claras, sin fórmulas ni plantillas complicadas.'
    },
    {
      title: 'Controla entradas y salidas en el momento',
      body: 'Cada movimiento queda registrado con responsable y fecha, para que sepas siempre qué entró, qué salió y por qué.'
    },
    {
      title: 'Organiza tu operación por bodegas',
      body: 'Si tienes más de un punto de almacenamiento, ves el stock real en cada uno y mueves productos entre bodegas sin perder el control.'
    },
    {
      title: 'Consulta el estado de tu stock cuando quieras',
      body: 'Revisa saldos, movimientos recientes y alertas de stock bajo en un panel sencillo, pensado para usarse todos los días.'
    }
  ];
}
