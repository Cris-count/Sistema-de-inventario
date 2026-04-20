import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';
import { fadeUp, staggerList } from '../../../../core/animations';
import { PlanesService } from '../../../../core/services/planes.service';
import type { PublicPlanDto } from '../../../../core/models/public-plan.model';
import { formatPlanPrecioMensual, planMensualCadence } from '../../../../core/util/format-plan-price';

interface LandingPlanView {
  id: string;
  codigo: string;
  name: string;
  blurb: string;
  idealFor: string;
  price: string;
  cadence: string;
  priceNote: string | null;
  cta: string;
  highlight: boolean;
  badgeLabel: string | null;
  bullets: string[];
}

@Component({
  selector: 'app-landing-pricing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiBadgeComponent, UiCardComponent],
  animations: [fadeUp, staggerList],
  template: `
    <section
      id="planes"
      class="scroll-mt-24 border-t border-slate-200/80 bg-gradient-to-b from-slate-50 to-white py-section-lg dark:border-slate-800 dark:from-slate-950 dark:to-slate-950"
      aria-labelledby="planes-heading"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div @fadeUp class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-accent">Planes</p>
          <h2
            id="planes-heading"
            class="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl dark:text-slate-100"
          >
            Elige el nivel de control que tu operación necesita hoy
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Precios en pesos colombianos y límites publicados igual que en el catálogo: sin sorpresas al registrar tu
            empresa.
          </p>
        </div>

        @if (loading()) {
          <p
            class="mx-auto mt-10 max-w-md text-center text-sm text-secondary dark:text-slate-500"
            role="status"
          >
            Cargando planes…
          </p>
        }

        @if (error()) {
          <p
            class="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/55 dark:text-amber-100"
          >
            {{ error() }}
          </p>
        }

        @if (!loading() && plans().length > 0) {
          <div [@staggerList]="plans().length" class="mt-12 grid gap-6 lg:grid-cols-3">
            @for (p of plans(); track p.id) {
              <article class="relative flex h-full flex-col">
                <app-ui-card
                  [highlighted]="p.highlight"
                  class="lp-card-hover lp-pricing-card relative flex h-full flex-col pt-2"
                >
                  @if (p.badgeLabel) {
                    <app-ui-badge
                      tone="accent"
                      class="absolute -top-3 left-1/2 z-10 -translate-x-1/2 shadow-sm"
                    >
                      {{ p.badgeLabel }}
                    </app-ui-badge>
                  }

                  <div [class]="p.badgeLabel ? 'mt-4' : ''">
                    <h3 class="text-xl font-semibold tracking-tight text-primary dark:text-slate-100">
                      {{ p.name }}
                    </h3>
                    <p class="mt-2 text-sm font-medium text-secondary dark:text-slate-400">
                      {{ p.idealFor }}
                    </p>
                    <p class="mt-3 text-sm leading-relaxed text-secondary dark:text-slate-400">
                      {{ p.blurb }}
                    </p>
                  </div>

                  <div class="mt-6 border-t border-slate-200/80 pt-6 dark:border-slate-600/60">
                    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span
                        class="text-4xl font-semibold tracking-tight text-primary dark:text-slate-100"
                        >{{ p.price }}</span
                      >
                      @if (p.cadence) {
                        <span class="text-sm text-secondary dark:text-slate-400">{{ p.cadence }}</span>
                      }
                    </div>
                    @if (p.priceNote) {
                      <p class="mt-1 text-xs text-secondary dark:text-slate-500">{{ p.priceNote }}</p>
                    }
                  </div>

                  <ul class="mt-6 flex flex-1 flex-col gap-3 text-sm text-secondary dark:text-slate-400">
                    @for (line of p.bullets; track line) {
                      <li class="flex gap-3">
                        <span
                          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/25 dark:bg-accent/15 dark:ring-accent/30"
                          aria-hidden="true"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="m5 12 5 5L20 7" />
                          </svg>
                        </span>
                        <span class="leading-snug">{{ line }}</span>
                      </li>
                    }
                  </ul>

                  <div class="mt-8">
                    <app-ui-button
                      [variant]="p.highlight ? 'primary' : 'secondary'"
                      size="lg"
                      class="w-full"
                      linkTo="/registro"
                      [queryParams]="{ plan: p.id }"
                      >{{ p.cta }}</app-ui-button
                    >
                  </div>
                </app-ui-card>
              </article>
            }
          </div>
        }

        @if (!loading() && !error() && plans().length === 0) {
          <p
            class="mx-auto mt-10 max-w-xl text-center text-sm text-secondary dark:text-slate-500"
            role="status"
          >
            No hay planes disponibles en este momento. Puedes intentar de nuevo más tarde o escribirnos
            desde el contacto de la página.
          </p>
        }

        @if (!loading() && plans().length > 0) {
          <p
            @fadeUp
            class="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-secondary dark:text-slate-500"
          >
            Los límites y módulos coinciden con el catálogo público del producto. Al crecer, puedes
            cambiar de plan y conservar tu información. Si necesitas condiciones especiales o varias
            sedes, te orientamos en la activación.
          </p>
        }
      </div>
    </section>
  `
})
export class LandingPricingComponent implements OnInit {
  private readonly planesApi = inject(PlanesService);

  readonly plans = signal<LandingPlanView[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.planesApi.listPublicPlanes().subscribe({
      next: (list) => {
        this.error.set(null);
        this.loading.set(false);
        this.plans.set(this.toView(list));
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'No se pudieron cargar los planes en este momento. Puedes continuar al registro e intentarlo de nuevo.'
        );
        this.plans.set([]);
      }
    });
  }

  private toView(plans: PublicPlanDto[]): LandingPlanView[] {
    return plans.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      name: p.nombre,
      blurb: (p.descripcionCorta || p.descripcion || '').trim(),
      idealFor: idealForLine(p.codigo),
      price: formatPlanPrecioMensual(p),
      cadence: planMensualCadence(p),
      priceNote: priceNoteFor(p),
      cta: 'Empezar con este plan',
      highlight: p.recomendado,
      badgeLabel: p.recomendado ? 'Recomendado' : null,
      bullets: buildBullets(p)
    }));
  }
}

function idealForLine(codigo: string): string {
  switch (codigo.trim().toUpperCase()) {
    case 'STARTER':
      return 'Ideal para operaciones que necesitan control sin complejidad innecesaria.';
    case 'PROFESIONAL':
      return 'Pensado para equipos que manejan varias bodegas o más volumen operativo.';
    case 'EMPRESA':
      return 'Una base sólida para crecer con procesos más consistentes y más capacidad.';
    default:
      return 'Adecuado para equipos que gestionan inventario con límites claros.';
  }
}

function priceNoteFor(p: PublicPlanDto): string | null {
  if (p.tipo === 'EMPRESARIAL' && Number(p.precioMensual) <= 0) {
    return 'Hablemos de tu operación y te proponemos condiciones alineadas.';
  }
  if (Number(p.precioMensual) <= 0) {
    return 'Te indicamos valor y alcance al registrar o con el equipo comercial.';
  }
  return null;
}

function capacityLine(p: PublicPlanDto): string {
  const b = p.maxBodegas;
  const u = p.maxUsuarios;
  if (b >= 100 && u >= 100) {
    return 'Capacidad ampliada en bodegas y usuarios para operaciones grandes.';
  }
  const bTxt = b === 1 ? '1 bodega' : `${b} bodegas`;
  const uTxt = u === 1 ? '1 usuario' : `${u} usuarios`;
  return `Incluye hasta ${bTxt} y ${uTxt}.`;
}

function productLine(p: PublicPlanDto): string | null {
  if (p.maxProductos === undefined) {
    return null;
  }
  if (p.maxProductos === null) {
    return 'Catálogo de productos sin tope definido en este plan.';
  }
  return `Hasta ${p.maxProductos} productos en el catálogo.`;
}

function buildBullets(p: PublicPlanDto): string[] {
  const out: string[] = [capacityLine(p)];
  const prod = productLine(p);
  if (prod) {
    out.push(prod);
  }
  const feats = p.features ?? [];
  for (const f of feats) {
    const t = f.trim();
    if (t) {
      out.push(t);
    }
  }
  return out;
}
