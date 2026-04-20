import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { EmpresaForm, PublicPlanDto, SuperAdminForm } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui/card/ui-card.component';
import { formatPlanPrecioMensual, planMensualCadence } from '../../../core/util/format-plan-price';

@Component({
  selector: 'app-register-step-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, UiCardComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary dark:text-slate-100">4. Confirmación</h2>
      <p class="text-sm text-secondary dark:text-slate-400">Revisa los datos antes de crear la empresa y la suscripción inicial.</p>
    </div>

    <app-ui-card class="mt-6 space-y-4 text-sm">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-accent">Plan</p>
        <p class="mt-1 font-medium text-primary dark:text-slate-100">{{ plan()?.nombre ?? planCodigo() }}</p>
        @if (plan(); as pl) {
          <p class="mt-1 text-secondary dark:text-slate-400">
            <span class="font-medium text-primary dark:text-slate-200">Precio mensual:</span>
            {{ resumenPrecio(pl) }}
          </p>
        }
      </div>
      <div class="border-t border-slate-100 pt-4 dark:border-slate-700">
        <p class="text-xs font-semibold uppercase tracking-wider text-accent">Empresa</p>
        <ul class="mt-2 space-y-1 text-secondary dark:text-slate-400">
          <li><span class="font-medium text-primary dark:text-slate-200">Nombre:</span> {{ empresa().nombre }}</li>
          <li><span class="font-medium text-primary dark:text-slate-200">ID:</span> {{ empresa().identificacion }}</li>
          <li><span class="font-medium text-primary dark:text-slate-200">Sector:</span> {{ empresa().sector }}</li>
          <li><span class="font-medium text-primary dark:text-slate-200">Correo:</span> {{ empresa().emailContacto }}</li>
          <li><span class="font-medium text-primary dark:text-slate-200">Teléfono:</span> {{ empresa().telefono || '—' }}</li>
          <li><span class="font-medium text-primary dark:text-slate-200">Ubicación:</span> {{ empresa().ciudad || '—' }}, {{ empresa().pais || '—' }}</li>
        </ul>
      </div>
      <div class="border-t border-slate-100 pt-4 dark:border-slate-700">
        <p class="text-xs font-semibold uppercase tracking-wider text-accent">Super admin</p>
        <ul class="mt-2 space-y-1 text-secondary dark:text-slate-400">
          <li>
            <span class="font-medium text-primary dark:text-slate-200">Nombre:</span> {{ admin().nombre }} {{ admin().apellido }}
          </li>
          <li><span class="font-medium text-primary dark:text-slate-200">Correo:</span> {{ admin().email }}</li>
        </ul>
      </div>
    </app-ui-card>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800 dark:text-amber-200">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <app-ui-button variant="outline" class="w-full sm:w-auto sm:min-w-[11rem]" [disabled]="submitting()" (click)="back.emit()">
        Atrás: editar administrador
      </app-ui-button>
      <app-ui-button variant="gradient" class="w-full sm:w-auto sm:min-w-[13rem]" [disabled]="submitting()" (click)="confirm.emit()">
        @if (submitting()) {
          Creando cuenta…
        } @else {
          Crear cuenta empresarial
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
