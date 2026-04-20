import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeUp, staggerList } from '../../../../core/animations';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

interface TrustPillar {
  title: string;
  body: string;
  icon: string;
}

/**
 * Sección de confianza HONESTA. No inventa testimonios, métricas ni logos de
 * clientes ficticios. Comunica posicionamiento real del producto y compromisos
 * que el sistema sí cumple (datos en la nube, planes escalables, soporte).
 */
@Component({
  selector: 'app-landing-trust',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  animations: [fadeUp, staggerList],
  template: `
    <section
      aria-label="Confianza"
      class="bg-background py-section dark:bg-slate-950"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div @fadeUp class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-accent">Confianza</p>
          <h2 class="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl dark:text-slate-100">
            Pensado para pymes que quieren operar con más orden
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            No prometemos magia. Te ofrecemos un sistema serio, escalable y diseñado para crecer
            contigo cada mes.
          </p>
        </div>

        <div [@staggerList]="pillars.length" class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (p of pillars; track p.title) {
            <app-ui-card class="lp-card-hover flex flex-col gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30"
                aria-hidden="true"
                [innerHTML]="p.icon"
              ></div>
              <h3 class="text-base font-semibold text-primary dark:text-slate-100">{{ p.title }}</h3>
              <p class="text-sm leading-relaxed text-secondary dark:text-slate-400">{{ p.body }}</p>
            </app-ui-card>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingTrustComponent {
  private readonly icon = (path: string) =>
    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

  readonly pillars: readonly TrustPillar[] = [
    {
      title: 'Diseñado para negocios con movimientos diarios',
      body: 'Operación pensada para entradas, salidas y consultas constantes — no para revisar Excel una vez al mes.',
      icon: this.icon('<path d="M3 12h4l2-7 4 14 2-7h6"/>')
    },
    {
      title: 'Escalable por planes según el crecimiento',
      body: 'Empieza pequeño y sube de plan cuando lo necesites. Sin cambios bruscos, sin migrar de sistema.',
      icon: this.icon('<path d="M3 21V3"/><path d="M3 21h18"/><path d="M7 17v-4"/><path d="M11 17v-7"/><path d="M15 17v-3"/><path d="M19 17V8"/>')
    },
    {
      title: 'Tus datos en la nube, accesibles desde donde estés',
      body: 'Sin instalaciones complicadas: entras desde el navegador, en oficina, bodega o de viaje.',
      icon: this.icon('<path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 16"/><path d="M9 19h11"/>')
    },
    {
      title: 'Roles y permisos claros para tu equipo',
      body: 'Separa administración, bodega y consulta. Cada perfil ve lo que necesita para su trabajo.',
      icon: this.icon('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>')
    },
    {
      title: 'Soporte humano cuando arranques',
      body: 'Te orientamos para configurar tus bodegas, productos y usuarios sin perderte en el proceso.',
      icon: this.icon('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')
    },
    {
      title: 'Sin contratos eternos',
      body: 'Cancelas cuando quieras. Mientras lo uses, te ayudamos a sacarle el mayor provecho.',
      icon: this.icon('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>')
    }
  ];
}
