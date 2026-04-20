import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { fadeUp } from '../../../../core/animations';
import { PlanesService } from '../../../../core/services/planes.service';
import type { PublicPlanDto } from '../../../../core/models/public-plan.model';
import { moduloLabel } from '../../../../core/util/modulo-labels';
import { UiBadgeComponent } from '../../../../shared/components/ui/badge/ui-badge.component';

interface CompareRow {
  /** Etiqueta humana de la fila. */
  label: string;
  /** Valor por plan en orden recibido del backend. */
  values: Array<{ planId: string; cell: string; on: boolean | null }>;
}

/**
 * Comparativa breve de planes. **Reutiliza el mismo `PublicPlanDto` ya enriquecido**
 * con `modulos` / `maxUsuarios` / `maxBodegas` / `maxProductos` desde
 * `PlanEntitlementsRegistry`. Sin duplicar lógica ni endpoints.
 *
 * Si el backend antiguo aún no proyecta `modulos` / `maxProductos`, las
 * filas correspondientes se marcan como "—" en lugar de inventar datos.
 */
@Component({
  selector: 'app-landing-plans-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiBadgeComponent],
  animations: [fadeUp],
  template: `
    <section
      @fadeUp
      aria-label="Comparativa rápida de planes"
      class="bg-surface py-section dark:bg-slate-900"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold uppercase tracking-wider text-accent">Comparativa rápida</p>
          <h2 class="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl dark:text-slate-100">
            ¿En qué se diferencian los planes?
          </h2>
          <p class="mt-4 text-lg text-secondary dark:text-slate-400">
            Una vista corta de capacidades y módulos para que veas de un vistazo cuál se ajusta a tu
            operación.
          </p>
        </div>

        @if (plans().length === 0) {
          <p class="mx-auto mt-8 max-w-2xl rounded-xl border border-slate-200 bg-background px-4 py-3 text-center text-sm text-secondary dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            Cargando planes…
          </p>
        } @else {
          <div class="mt-10 overflow-x-auto rounded-2xl border border-slate-200/80 bg-background shadow-soft dark:border-slate-700/80 dark:bg-slate-950">
            <table class="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/60 text-left dark:border-slate-700 dark:bg-slate-900/60">
                  <th
                    scope="col"
                    class="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-secondary dark:text-slate-400"
                  >
                    Capacidad
                  </th>
                  @for (p of plans(); track p.id) {
                    <th
                      scope="col"
                      class="px-5 py-4 text-center"
                      [class.bg-accent-soft]="p.recomendado"
                      [class.dark:bg-accent\\/10]="p.recomendado"
                    >
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-base font-semibold text-primary dark:text-slate-100">{{ p.nombre }}</span>
                        @if (p.recomendado) {
                          <app-ui-badge tone="accent" class="!text-[10px] !tracking-wider">Recomendado</app-ui-badge>
                        }
                      </div>
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.label) {
                  <tr class="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                    <th
                      scope="row"
                      class="px-5 py-3 text-left text-sm font-medium text-primary dark:text-slate-200"
                    >
                      {{ row.label }}
                    </th>
                    @for (v of row.values; track v.planId) {
                      <td
                        class="px-5 py-3 text-center text-sm text-secondary dark:text-slate-400"
                        [class.bg-accent-soft\\/60]="isHighlighted(v.planId)"
                        [class.dark:bg-accent\\/5]="isHighlighted(v.planId)"
                      >
                        @if (v.on === true) {
                          <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent/20 dark:bg-accent/15 dark:ring-accent/30" aria-label="Incluido">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="m5 12 5 5L20 7" />
                            </svg>
                          </span>
                        } @else if (v.on === false) {
                          <span class="inline-block text-slate-300 dark:text-slate-600" aria-label="No incluido">—</span>
                        } @else {
                          <span class="font-semibold text-primary dark:text-slate-100">{{ v.cell }}</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="mx-auto mt-4 max-w-2xl text-center text-xs text-secondary dark:text-slate-500">
            Información tomada directamente del catálogo público. Si necesitas un detalle adicional,
            escríbenos y te orientamos.
          </p>
        }
      </div>
    </section>
  `
})
export class LandingPlansCompareComponent implements OnInit {
  private readonly planesApi = inject(PlanesService);

  /** Lista plana de planes ya ordenada como llega del backend. */
  readonly plans = signal<PublicPlanDto[]>([]);

  /** Filas a renderizar; vacío hasta tener planes para evitar parpadeo. */
  readonly rows = computed<CompareRow[]>(() => {
    const list = this.plans();
    if (list.length === 0) {
      return [];
    }
    return [
      this.numericRow('Usuarios', list, (p) => p.maxUsuarios),
      this.numericRow('Bodegas', list, (p) => p.maxBodegas),
      this.numericRow('Productos', list, (p) => p.maxProductos ?? null),
      this.moduleRow('Reportes', list, ['reportes_basicos', 'reportes_avanzados']),
      this.moduleRow('Transferencias', list, ['transferencias']),
      this.moduleRow('Ajustes de inventario', list, ['ajustes_inventario']),
      this.moduleRow('Historial de movimientos', list, ['historial_movimientos'])
    ];
  });

  ngOnInit(): void {
    this.planesApi.listPublicPlanes().subscribe({
      next: (list) => this.plans.set(list),
      error: () => this.plans.set([])
    });
  }

  protected isHighlighted(planId: string): boolean {
    return this.plans().find((p) => p.id === planId)?.recomendado ?? false;
  }

  /** Renderiza fila numérica: número, "Ilimitado" o "—" si no aplica. */
  private numericRow(
    label: string,
    plans: PublicPlanDto[],
    pick: (p: PublicPlanDto) => number | null | undefined
  ): CompareRow {
    return {
      label,
      values: plans.map((p) => {
        const v = pick(p);
        if (v === null) {
          return { planId: p.id, cell: 'Ilimitado', on: null };
        }
        if (v === undefined || Number.isNaN(v as number)) {
          return { planId: p.id, cell: '—', on: null };
        }
        return { planId: p.id, cell: String(v), on: null };
      })
    };
  }

  /** Renderiza fila de módulos: ✓ si el plan tiene cualquiera de los códigos. */
  private moduleRow(label: string, plans: PublicPlanDto[], anyOf: string[]): CompareRow {
    return {
      label,
      values: plans.map((p) => {
        const mods = p.modulos;
        if (!mods) {
          // Backend sin proyección de módulos: no inventamos, mostramos guión.
          return { planId: p.id, cell: '—', on: null };
        }
        const has = anyOf.some((code) => mods.includes(code));
        return { planId: p.id, cell: has ? '✓' : '—', on: has };
      })
    };
  }

  /** Disponible para futuros tooltips: convierte código técnico en humano. */
  protected readonly moduloHuman = (code: string): string => moduloLabel(code);
}
