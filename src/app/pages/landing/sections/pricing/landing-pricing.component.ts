import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';
import { PlanesService } from '../../../../core/services/planes.service';
import type { PublicPlanDto } from '../../../../core/models/public-plan.model';
import { formatPlanPrecioMensual, planMensualCadence } from '../../../../core/util/format-plan-price';

interface LandingPlanView {
  id: string;
  codigo: string;
  name: string;
  blurb: string;
  price: string;
  cadence: string;
  cta: string;
  highlight: boolean;
  features: string[];
}

@Component({
  selector: 'app-landing-pricing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent],
  template: `
    <section id="planes" class="bg-background py-section">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">Control profesional de inventario</h2>
          <p class="mt-4 text-lg text-secondary">
            Diseñado para crecer con tu empresa. Precios transparentes en pesos colombianos, misma oferta en toda la
            plataforma.
          </p>
        </div>

        @if (error()) {
          <p class="mx-auto mt-5 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {{ error() }}
          </p>
        }

        <div class="mt-12 grid gap-6 lg:grid-cols-3">
          @for (p of plans(); track p.id) {
            <article
              [class]="
                'relative flex flex-col rounded-2xl border bg-surface p-6 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-md ' +
                (p.highlight ? 'border-teal-200 ring-2 ring-teal-100' : 'border-slate-200/80')
              "
            >
              @if (p.highlight) {
                <app-ui-badge tone="accent" class="absolute -top-3 left-1/2 -translate-x-1/2"
                  >Más popular</app-ui-badge
                >
              }
              <h3 class="text-lg font-semibold text-primary">{{ p.name }}</h3>
              <p class="mt-2 text-sm text-secondary">{{ p.blurb }}</p>
              <p class="mt-6 flex items-baseline gap-1">
                <span class="text-4xl font-semibold tracking-tight text-primary">{{ p.price }}</span>
                <span class="text-sm text-secondary">{{ p.cadence }}</span>
              </p>
              <ul class="mt-6 space-y-2 text-sm text-secondary">
                @for (f of p.features; track f) {
                  <li class="flex gap-2">
                    <span class="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent"></span>
                    <span>{{ f }}</span>
                  </li>
                }
              </ul>
              <div class="mt-8">
                <app-ui-button
                  [variant]="p.highlight ? 'landing-primary' : 'landing-secondary'"
                  class="w-full"
                  linkTo="/registro"
                  [queryParams]="{ plan: p.id }"
                  >{{ p.cta }}</app-ui-button
                >
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingPricingComponent implements OnInit {
  private readonly planesApi = inject(PlanesService);

  readonly plans = signal<LandingPlanView[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.planesApi.listPublicPlanes().subscribe({
      next: (list) => {
        this.error.set(null);
        this.plans.set(this.toView(list));
      },
      error: () => {
        this.error.set('No se pudieron cargar los planes en este momento. Puedes continuar al registro e intentarlo de nuevo.');
        this.plans.set([]);
      }
    });
  }

  private toView(plans: PublicPlanDto[]): LandingPlanView[] {
    return plans.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      name: p.nombre,
      blurb: p.descripcionCorta || p.descripcion || '',
      price: formatPlanPrecioMensual(p),
      cadence: planMensualCadence(p),
      cta: p.recomendado ? 'Elegir plan' : 'Comenzar',
      highlight: p.recomendado,
      features: p.features ?? []
    }));
  }
}
