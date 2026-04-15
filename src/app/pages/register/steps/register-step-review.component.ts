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
      <h2 class="text-xl font-semibold tracking-tight text-primary">4. Confirmación</h2>
      <p class="text-sm text-secondary">Revisa los datos antes de crear la empresa y la suscripción inicial.</p>
    </div>

    <div class="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-surface p-5 text-sm shadow-soft">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-secondary">Plan</p>
        <p class="mt-1 font-medium text-primary">{{ plan()?.nombre ?? planCodigo() }}</p>
        @if (plan(); as pl) {
          <p class="mt-1 text-secondary">
            <span class="text-primary/80">Precio mensual:</span>
            {{ resumenPrecio(pl) }}
          </p>
        }
      </div>
      <div class="border-t border-slate-100 pt-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-secondary">Empresa</p>
        <ul class="mt-2 space-y-1 text-secondary">
          <li><span class="text-primary/80">Nombre:</span> {{ empresa().nombre }}</li>
          <li><span class="text-primary/80">ID:</span> {{ empresa().identificacion }}</li>
          <li><span class="text-primary/80">Sector:</span> {{ empresa().sector }}</li>
          <li><span class="text-primary/80">Correo:</span> {{ empresa().emailContacto }}</li>
          <li><span class="text-primary/80">Teléfono:</span> {{ empresa().telefono || '—' }}</li>
          <li><span class="text-primary/80">Ubicación:</span> {{ empresa().ciudad || '—' }}, {{ empresa().pais || '—' }}</li>
        </ul>
      </div>
      <div class="border-t border-slate-100 pt-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-secondary">Super admin</p>
        <ul class="mt-2 space-y-1 text-secondary">
          <li>
            <span class="text-primary/80">Nombre:</span> {{ admin().nombre }} {{ admin().apellido }}
          </li>
          <li><span class="text-primary/80">Correo:</span> {{ admin().email }}</li>
        </ul>
      </div>
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800">{{ hint() }}</p>
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
