import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { EmpresaForm, PublicPlanDto, SuperAdminForm } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { formatPlanPrecioMensual, planMensualCadence } from '../../../core/util/format-plan-price';

@Component({
  selector: 'app-register-step-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">4. Confirmación</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400">Revisa los datos antes de crear la empresa y la suscripción inicial.</p>
    </div>

    <div
      class="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-surface p-5 text-sm shadow-soft dark:border-slate-600 dark:bg-slate-900/90"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Plan</p>
        <p class="mt-1 font-medium text-slate-900 dark:text-slate-100">{{ plan()?.nombre ?? planCodigo() }}</p>
        @if (plan(); as pl) {
          <p class="mt-1 text-slate-600 dark:text-slate-400">
            <span class="font-medium text-slate-700 dark:text-slate-300">Precio mensual:</span>
            {{ resumenPrecio(pl) }}
          </p>
        }
      </div>
      <div class="border-t border-slate-100 pt-4 dark:border-slate-700">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Empresa</p>
        <ul class="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
          <li><span class="font-medium text-slate-700 dark:text-slate-300">Nombre:</span> {{ empresa().nombre }}</li>
          <li><span class="font-medium text-slate-700 dark:text-slate-300">ID:</span> {{ empresa().identificacion }}</li>
          <li><span class="font-medium text-slate-700 dark:text-slate-300">Sector:</span> {{ empresa().sector }}</li>
          <li><span class="font-medium text-slate-700 dark:text-slate-300">Correo:</span> {{ empresa().emailContacto }}</li>
          <li><span class="font-medium text-slate-700 dark:text-slate-300">Teléfono:</span> {{ empresa().telefono || '—' }}</li>
          <li><span class="font-medium text-slate-700 dark:text-slate-300">Ubicación:</span> {{ empresa().ciudad || '—' }}, {{ empresa().pais || '—' }}</li>
        </ul>
      </div>
      <div class="border-t border-slate-100 pt-4 dark:border-slate-700">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Super admin</p>
        <ul class="mt-2 space-y-1 text-slate-600 dark:text-slate-400">
          <li>
            <span class="font-medium text-slate-700 dark:text-slate-300">Nombre:</span> {{ admin().nombre }} {{ admin().apellido }}
          </li>
          <li><span class="font-medium text-slate-700 dark:text-slate-300">Correo:</span> {{ admin().email }}</li>
        </ul>
      </div>
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800 dark:text-amber-200">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-wrap justify-between gap-2">
      <app-ui-button variant="secondary" [disabled]="submitting()" (click)="back.emit()">Atrás</app-ui-button>
      <app-ui-button variant="gradient" [disabled]="submitting()" (click)="confirm.emit()">
        @if (submitting()) {
          Creando…
        } @else {
          Crear cuenta
        }
      </app-ui-button>
    </div>
  `
})
export class RegisterStepReviewComponent {
  readonly planCodigo = input.required<string>();
  readonly plan = input<PublicPlanDto | null>(null);
  readonly empresa = input.required<EmpresaForm>();
  readonly admin = input.required<SuperAdminForm>();
  readonly submitting = input(false);
  readonly hint = input<string | null>(null);
  readonly confirm = output<void>();
  readonly back = output<void>();

  resumenPrecio(p: PublicPlanDto): string {
    const base = formatPlanPrecioMensual(p);
    const suf = planMensualCadence(p);
    return suf ? `${base}${suf}` : base;
  }
}
