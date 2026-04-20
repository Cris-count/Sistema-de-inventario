import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeUp, staggerList } from '../../../../core/animations';
import { UiCardComponent } from '../../../../shared/components/ui/card/ui-card.component';

const SOL_IMG = 'assets/images/soluciones';

interface SolutionCard {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  featureLine: string;
  cta: string;
}

/**
 * Soluciones por tipo de negocio (#soluciones).
 * Cada tarjeta enlaza a #planes (mismo producto para todos los verticales).
 */
@Component({
  selector: 'app-landing-sectors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiCardComponent],
  animations: [fadeUp, staggerList],
  template: `
    <section id="soluciones" class="bg-background py-section dark:bg-slate-950">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div @fadeUp class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-accent">Soluciones</p>
          <h2 class="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl dark:text-slate-100">
            Un mismo inventario, adaptado a cómo vendes y operas
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Control de stock, bodegas y movimientos con una API y panel listos para producción. Estas
            son formas típicas en las que los equipos lo usan día a día.
          </p>
        </div>

        <div
          [@staggerList]="solutions.length"
          class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          @for (card of solutions; track card.id) {
            <a
              href="#planes"
              class="group flex h-full no-underline outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-slate-950"
            >
              <app-ui-card
                [padded]="false"
                class="lp-card-hover lp-sector-card flex h-full min-h-[100%] flex-col overflow-hidden shadow-sm"
              >
                <div
                  class="relative aspect-[5/3] w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800"
                >
                  <img
                    class="lp-sector-img h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                    [src]="card.image"
                    [alt]="card.imageAlt"
                    loading="lazy"
                    decoding="async"
                    width="640"
                    height="384"
                  />
                  <div
                    class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100 dark:from-slate-950/40"
                    aria-hidden="true"
                  ></div>
                </div>

                <div class="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 class="text-base font-semibold leading-snug text-primary dark:text-slate-100">
                    {{ card.title }}
                  </h3>
                  <p class="mt-2 flex-1 text-sm leading-relaxed text-secondary dark:text-slate-400">
                    {{ card.description }}
                  </p>
                  <p class="mt-4 text-xs font-semibold tracking-wide text-accent dark:text-accent/90">
                    {{ card.featureLine }}
                  </p>
                  <span
                    class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent transition duration-200 group-hover:gap-2"
                  >
                    {{ card.cta }}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </app-ui-card>
            </a>
          }
        </div>

        <p @fadeUp class="mx-auto mt-10 max-w-2xl text-center text-sm text-secondary dark:text-slate-500">
          ¿Tu negocio no aparece en la lista? Si manejas productos y bodegas, el flujo es el mismo:
          carga, ajusta permisos y empieza a registrar movimientos.
        </p>
      </div>
    </section>
  `
})
export class LandingSectorsComponent {
  readonly solutions: readonly SolutionCard[] = [
    {
      id: 'tiendas',
      title: 'Tiendas y minimercados',
      description:
        'Controla stock, precios y reposición diaria para mantener tu operación siempre abastecida y con números confiables en caja y bodega.',
      image: `${SOL_IMG}/tiendas-minimercados.png`,
      imageAlt: 'Mostrador y estanterías de una tienda de barrio con inventario ordenado',
      featureLine: 'Stock, precios y reposición',
      cta: 'Ver planes'
    },
    {
      id: 'ferreterias',
      title: 'Ferreterías',
      description:
        'Gestiona referencias, rotación y existencias por bodega sin perder orden ni trazabilidad cuando el catálogo crece.',
      image: `${SOL_IMG}/ferreterias.png`,
      imageAlt: 'Pasillo de ferretería con herramientas y materiales en exhibición',
      featureLine: 'Referencias, bodegas y rotación',
      cta: 'Ver planes'
    },
    {
      id: 'droguerias',
      title: 'Droguerías',
      description:
        'Lleva control por lotes, vencimientos y movimientos para reducir errores, auditorías improvisadas y quiebres de inventario.',
      image: `${SOL_IMG}/droguerias.png`,
      imageAlt: 'Interior de droguería o farmacia con productos de cuidado personal en estantes',
      featureLine: 'Lotes, vencimientos y trazabilidad',
      cta: 'Ver planes'
    },
    {
      id: 'restaurantes',
      title: 'Restaurantes',
      description:
        'Administra insumos, consumos y reposición para operar con menos desperdicio, recetas más estables y cocina alineada con compras.',
      image: `${SOL_IMG}/restaurantes.png`,
      imageAlt: 'Cocina de restaurante con equipo y alimentos en preparación',
      featureLine: 'Insumos, consumo y reposición',
      cta: 'Ver planes'
    },
    {
      id: 'moda',
      title: 'Moda y calzado',
      description:
        'Organiza tallas, colores, referencias y stock por sede desde una sola plataforma, ideal para catálogos con variantes.',
      image: `${SOL_IMG}/moda-calzado.png`,
      imageAlt: 'Tienda de moda con prendas y calzado exhibidos',
      featureLine: 'Variantes y stock por sede',
      cta: 'Ver planes'
    },
    {
      id: 'talleres',
      title: 'Talleres',
      description:
        'Controla repuestos, herramientas y consumibles con entradas, salidas y responsables claros en cada movimiento.',
      image: `${SOL_IMG}/talleres.png`,
      imageAlt: 'Taller mecánico o industrial con herramientas y repuestos',
      featureLine: 'Repuestos y movimientos',
      cta: 'Ver planes'
    },
    {
      id: 'hoteles',
      title: 'Hoteles',
      description:
        'Mantén orden sobre amenities, lavandería y suministros operativos por área o bodega, con visibilidad para housekeeping y compras.',
      image: `${SOL_IMG}/hoteles.png`,
      imageAlt: 'Lobby o habitación de hotel impecable, operación hotelera',
      featureLine: 'Suministros por área y bodega',
      cta: 'Ver planes'
    },
    {
      id: 'parqueaderos',
      title: 'Parqueaderos',
      description:
        'Gestiona insumos, repuestos y consumibles del día a día —desde papelería hasta repuestos de barrera— con control y alertas operativas.',
      image: `${SOL_IMG}/parqueaderos.png`,
      imageAlt: 'Operación de parqueadero o estacionamiento con vehículos',
      featureLine: 'Operación, consumibles y control',
      cta: 'Ver planes'
    }
  ];
}
