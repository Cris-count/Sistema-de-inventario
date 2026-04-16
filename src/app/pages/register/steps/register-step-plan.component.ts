import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { PublicPlanDto } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { formatPlanPrecioMensual, planMensualCadence } from '../../../core/util/format-plan-price';

@Component({
  selector: 'app-register-step-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">1. Elige tu plan</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Mismos precios que en la página principal. Podrás escalar sin límites según política comercial cuando lo necesites.
      </p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-1">
      @for (p of plans(); track p.codigo) {
        <button
          type="button"
          (click)="pick.emit(p.codigo)"
          class="w-full rounded-2xl border border-slate-200 bg-surface p-4 text-left transition hover:border-teal-200 hover:shadow-sm dark:border-slate-600 dark:bg-slate-900/90 dark:hover:border-teal-600/50"
          [class.ring-2]="selectedCodigo() === p.codigo"
          [class.ring-teal-400]="selectedCodigo() === p.codigo"
          [class.border-teal-300]="selectedCodigo() === p.codigo"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="font-semibold text-slate-900 dark:text-slate-100">{{ p.nombre }}</span>
            <span class="text-sm font-medium text-slate-900 dark:text-slate-100">
              {{ etiquetaPrecio(p) }}
            </span>
          </div>
          @if (p.descripcion) {
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">{{ p.descripcion }}</p>
          }
          <ul class="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
            @for (f of p.features; track f) {
              <li class="flex gap-2">
                <span class="text-accent">·</span><span>{{ f }}</span>
              </li>
            }
          </ul>
          <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">Hasta {{ p.maxBodegas }} bodegas · hasta {{ p.maxUsuarios }} usuarios</p>
        </button>
      }
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800 dark:text-amber-200">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-wrap justify-end gap-2">
      <app-ui-button variant="ghost" linkTo="/landing">Volver</app-ui-button>
      <app-ui-button variant="gradient" [disabled]="!selectedCodigo()" (click)="advance.emit()">Continuar</app-ui-button>
    </div>
  `
})
export class RegisterStepPlanComponent {
  readonly plans = input.required<PublicPlanDto[]>();
  readonly selectedCodigo = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly pick = output<string>();
  readonly advance = output<void>();

  etiquetaPrecio(p: PublicPlanDto): string {
    const base = formatPlanPrecioMensual(p);
    const suf = planMensualCadence(p);
    return suf ? `${base}${suf}` : base;
  }
}
