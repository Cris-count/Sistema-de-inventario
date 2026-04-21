import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';
import { RevealOnScrollDirective } from '../../../../shared/directives/reveal-on-scroll.directive';

type FeatureIcon =
  | 'box'
  | 'layers'
  | 'arrow'
  | 'activity'
  | 'shield'
  | 'branch'
  | 'brackets'
  | 'checklist';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  featureLine: string;
  icon: FeatureIcon;
}

/**
 * Funcionalidades del producto (#funcionalidades). Copy alineado a capacidades
 * reales del backend (productos, bodegas, movimientos, reportes, roles, API REST).
 *
 * Motion: reveal al viewport con [appReveal] + lp-stagger (coherente con Soluciones);
 * sin animaciones de entrada al montar el componente.
 */
@Component({
  selector: 'app-landing-features',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent, RevealOnScrollDirective],
  template: `
    <section
      id="funcionalidades"
      class="lp-features-section bg-surface py-section dark:bg-slate-900"
      aria-labelledby="funcionalidades-heading"
    >
      <div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p
            appReveal
            [revealDelay]="0"
            class="text-xs font-semibold uppercase tracking-wider text-accent"
          >
            Funcionalidades
          </p>
          <h2
            appReveal
            [revealDelay]="70"
            id="funcionalidades-heading"
            class="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl dark:text-slate-100"
          >
            Todo lo que necesitas para inventario serio, en un solo lugar
          </h2>
          <p
            appReveal
            [revealDelay]="140"
            class="mt-4 text-lg text-secondary dark:text-slate-400"
          >
            Desde el catálogo hasta los movimientos y los permisos: un flujo coherente para que tu
            equipo trabaje con datos confiables y menos retrabajo.
          </p>
        </div>

        <div
          class="lp-stagger lp-stagger-features mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          @for (f of features; track f.id) {
            <article appReveal class="lp-feature-reveal flex h-full flex-col">
              <app-ui-card class="lp-card-hover lp-feature-card flex h-full flex-col">
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30"
                  aria-hidden="true"
                >
                  @switch (f.icon) {
                    @case ('box') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                        />
                        <path d="M3.3 7 12 12l8.7-5M12 22V12" />
                      </svg>
                    }
                    @case ('layers') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.31a2 2 0 0 0 1.66 0l8.58-3.31a1 1 0 0 0 0-1.83Z"
                        />
                        <path d="m22 17.65-9.17 3.54a2 2 0 0 1-1.66 0L2 17.65" />
                        <path d="m22 12.65-9.17 3.54a2 2 0 0 1-1.66 0L2 12.65" />
                      </svg>
                    }
                    @case ('arrow') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 3 4 7l4 4" />
                        <path d="M4 7h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                      </svg>
                    }
                    @case ('activity') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    }
                    @case ('shield') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      </svg>
                    }
                    @case ('branch') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <line x1="6" x2="6" y1="3" y2="15" />
                        <circle cx="18" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M18 9a9 9 0 0 1-9 9" />
                      </svg>
                    }
                    @case ('brackets') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                        <line x1="10" x2="14" y1="12" y2="12" />
                      </svg>
                    }
                    @case ('checklist') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.7"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                    }
                  }
                </div>

                <h3 class="mt-4 text-base font-semibold leading-snug text-primary dark:text-slate-100">
                  {{ f.title }}
                </h3>
                <p class="mt-2 flex-1 text-sm leading-relaxed text-secondary dark:text-slate-400">
                  {{ f.description }}
                </p>
                <p class="mt-4 text-xs font-semibold tracking-wide text-accent dark:text-accent/90">
                  {{ f.featureLine }}
                </p>
              </app-ui-card>
            </article>
          }
        </div>

        <p
          appReveal
          class="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-secondary dark:text-slate-500"
        >
          Incluye además reportes como kardex y exportación de movimientos para cerrar periodos sin
          reconstruir hojas a mano — la misma base técnica que alimenta el panel está disponible vía
          API REST para integraciones futuras.
        </p>
      </div>
    </section>
  `
})
export class LandingFeaturesComponent {
  readonly features: readonly FeatureCard[] = [
    {
      id: 'productos',
      title: 'Productos',
      description:
        'Centraliza tu catálogo con categorías, datos clave de cada ítem y criterios de búsqueda que el equipo de bodega puede usar todos los días.',
      featureLine: 'Catálogo centralizado',
      icon: 'box'
    },
    {
      id: 'bodegas',
      title: 'Bodegas',
      description:
        'Visualiza existencias por sede, almacén o punto operativo y evita desajustes entre lo que cree la oficina y lo que hay en piso.',
      featureLine: 'Stock por ubicación',
      icon: 'layers'
    },
    {
      id: 'movimientos',
      title: 'Movimientos',
      description:
        'Registra entradas, salidas, transferencias y ajustes con motivo y contexto, para que cada cambio de stock quede justificado.',
      featureLine: 'Entradas, salidas y ajustes',
      icon: 'arrow'
    },
    {
      id: 'stock-tiempo-real',
      title: 'Stock en tiempo real',
      description:
        'Consulta saldos actualizados por producto y bodega cuando los movimientos se registran. Apoya la operación con alertas y umbrales según la configuración de tu empresa.',
      featureLine: 'Visibilidad operativa',
      icon: 'activity'
    },
    {
      id: 'roles',
      title: 'Roles y permisos',
      description:
        'Controla quién puede ver, cargar movimientos o administrar datos sensibles. Perfiles como administración, bodega, compras o lectura mantienen el alcance acotado.',
      featureLine: 'Acceso por perfil',
      icon: 'shield'
    },
    {
      id: 'trazabilidad',
      title: 'Trazabilidad',
      description:
        'Mantén historial de movimientos con usuario y momento, y profundiza con kardex por producto o exportación cuando necesites auditar o cerrar mes.',
      featureLine: 'Historial y auditoría',
      icon: 'branch'
    },
    {
      id: 'api',
      title: 'API e integración',
      description:
        'El mismo dominio de inventario se expone en una API REST versionada y documentada, pensada para conectar procesos internos o integraciones a medida que vayan creciendo.',
      featureLine: 'REST bajo /api/v1',
      icon: 'brackets'
    },
    {
      id: 'operacion',
      title: 'Operación más ordenada',
      description:
        'Menos decisiones a ciegas y menos errores: un flujo único para productos, bodegas y movimientos que escala de un solo punto a varias sedes bajo la misma suscripción.',
      featureLine: 'Procesos consistentes',
      icon: 'checklist'
    }
  ];
}
