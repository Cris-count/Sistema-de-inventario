import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

type FeatureIcon = 'box' | 'layers' | 'arrow' | 'shield' | 'chart' | 'spark';

@Component({
  selector: 'app-landing-features',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  template: `
    <section id="funciones" class="bg-surface py-section">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            Todo lo esencial para operar inventario con rigor
          </h2>
          <p class="mt-4 text-lg text-secondary">
            Menos fricción para el equipo de bodega, más control para administración — sin sacrificar velocidad.
          </p>
        </div>

        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (f of features; track f.title) {
            <app-ui-card class="h-full">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-accent ring-1 ring-slate-100"
              >
                @switch (f.icon) {
                  @case ('box') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  }
                  @case ('shield') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                  }
                  @case ('chart') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                      <path d="M7 11h8" />
                      <path d="M7 16h12" />
                      <path d="M7 6h3" />
                    </svg>
                  }
                  @case ('spark') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"
                      />
                    </svg>
                  }
                }
              </div>
              <h3 class="mt-4 text-base font-semibold text-primary">{{ f.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-secondary">{{ f.body }}</p>
            </app-ui-card>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingFeaturesComponent {
  readonly features: Array<{ title: string; body: string; icon: FeatureIcon }> = [
    {
      title: 'Catálogo y categorías',
      body: 'Organiza productos con atributos claros y navegación rápida para quien carga y quien consulta.',
      icon: 'box'
    },
    {
      title: 'Multibodega real',
      body: 'Saldos por ubicación, transferencias y visibilidad unificada del stock disponible.',
      icon: 'layers'
    },
    {
      title: 'Movimientos con trazabilidad',
      body: 'Entradas, salidas, ajustes y transferencias con historial listo para auditoría.',
      icon: 'arrow'
    },
    {
      title: 'Roles y permisos',
      body: 'Admin, bodega, compras y lectura: cada perfil ve lo que necesita — nada más.',
      icon: 'shield'
    },
    {
      title: 'Reportes y exportación',
      body: 'Kardex y extractos para cerrar mes sin reconstruir Excel a mano.',
      icon: 'chart'
    },
    {
      title: 'Listo para suscripción',
      body: 'Planes, límites y consumo integrados para escalar de equipo interno a multi-sede.',
      icon: 'spark'
    }
  ];
}
