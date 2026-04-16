import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { EmpresaForm, PublicPlanDto, SuperAdminForm } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-register-step-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary">5. Confirmación</h2>
      <p class="text-sm text-secondary">Revisa los datos antes de crear la empresa y la suscripción inicial.</p>
    </div>

    <div class="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-surface p-5 text-sm shadow-soft">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-secondary">Plan</p>
        <p class="mt-1 font-medium text-primary">{{ plan()?.nombre ?? planCodigo() }}</p>
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
}
