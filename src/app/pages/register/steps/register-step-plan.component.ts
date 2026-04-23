import { ChangeDetectionStrategy, Component, Input, input, output } from '@angular/core';
import type { PublicPlanDto } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { formatPlanPrecioMensual, planMensualCadence } from '../../../core/util/format-plan-price';

@Component({
  selector: 'app-register-step-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary dark:text-slate-100">1. Elige tu plan</h2>
      <p class="text-sm text-secondary dark:text-slate-400">
        Mismos precios que en la página principal. Si el plan tiene costo mensual, completarás el pago con tarjeta (Stripe)
        antes de verificar tu correo y los demás datos.
      </p>
    </div>

    @if (confirmingPrepay) {
      <p class="mt-4 text-sm font-medium text-secondary dark:text-slate-300" role="status">
        Confirmando tu pago con el servidor…
      </p>
    }

    <div class="mt-6 grid gap-4 sm:grid-cols-1">
      @for (p of plans(); track p.codigo) {
        <button
          type="button"
          (click)="pick.emit(p.codigo)"
          class="w-full rounded-2xl border border-slate-200 bg-surface p-4 text-left transition hover:border-accent/40 hover:shadow-sm dark:border-slate-600 dark:bg-slate-900/90 dark:hover:border-accent/50"
          [class.ring-2]="selectedCodigo() === p.codigo"
          [class.ring-accent]="selectedCodigo() === p.codigo"
          [class.border-accent]="selectedCodigo() === p.codigo"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="font-semibold text-primary dark:text-slate-100">{{ p.nombre }}</span>
            <span class="text-sm font-medium text-primary dark:text-slate-100">
              {{ etiquetaPrecio(p) }}
            </span>
          </div>
          @if (p.descripcion) {
            <p class="mt-1 text-sm text-secondary dark:text-slate-400">{{ p.descripcion }}</p>
          }
          <ul class="mt-3 space-y-1 text-xs text-secondary dark:text-slate-400">
            @for (f of p.features; track f) {
              <li class="flex gap-2">
                <span class="text-accent">·</span><span>{{ f }}</span>
              </li>
            }
          </ul>
          <p class="mt-2 text-xs text-secondary dark:text-slate-400">Hasta {{ p.maxBodegas }} bodegas · hasta {{ p.maxUsuarios }} usuarios</p>
        </button>
      }
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800 dark:text-amber-200">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <app-ui-button variant="outline" class="order-2 w-full sm:order-1 sm:w-auto sm:min-w-[11rem]" to="/landing">
        Salir al inicio
      </app-ui-button>
      <app-ui-button
        variant="gradient"
        class="order-1 w-full sm:order-2 sm:min-w-[14rem]"
        [disabled]="!selectedCodigo() || prepayBusy || confirmingPrepay"
        (click)="advance.emit()"
      >
        {{ advanceCta() }}
      </app-ui-button>
    </div>
  `
})
export class RegisterStepPlanComponent {
  readonly plans = input.required<PublicPlanDto[]>();
  readonly selectedCodigo = input<string | null>(null);
  readonly hint = input<string | null>(null);
  @Input() prepayBusy = false;
  @Input() confirmingPrepay = false;
  readonly pick = output<string>();
  readonly advance = output<void>();

  advanceCta(): string {
    if (this.prepayBusy) {
      return 'Abriendo pago…';
    }
    const code = this.selectedCodigo();
    const p = code ? this.plans().find((x) => x.codigo === code) : undefined;
    if (p && p.precioMensual > 0) {
      return 'Continuar al pago';
    }
    return 'Siguiente: verificar correo';
  }

  etiquetaPrecio(p: PublicPlanDto): string {
    const base = formatPlanPrecioMensual(p);
    const suf = planMensualCadence(p);
    return suf ? `${base}${suf}` : base;
  }
}
