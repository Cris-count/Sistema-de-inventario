import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { OnboardingRegisterResponseDto } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-register-step-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary">5. Listo</h2>
      <p class="text-sm text-secondary">{{ result().message }}</p>
    </div>

    <div class="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-surface p-5 text-sm shadow-soft">
      <div class="flex flex-wrap justify-between gap-2">
        <span class="text-secondary">Empresa</span>
        <span class="font-medium text-primary">{{ result().empresaNombre }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
        <span class="text-secondary">Super admin</span>
        <span class="font-medium text-primary">{{ result().superAdminEmail }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
        <span class="text-secondary">Plan</span>
        <span class="font-medium text-primary">{{ result().planNombre }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
        <span class="text-secondary">Suscripción</span>
        <span class="font-medium text-primary">{{ result().suscripcionEstado }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
        <span class="text-secondary">Estado empresa</span>
        <span class="font-medium text-primary">{{ result().empresaEstadoComercial }}</span>
      </div>
      @if (result().pagoId != null || result().compraId != null) {
        <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-secondary">
          @if (result().pagoId != null) {
            <p>
              <span class="font-semibold text-primary">Referencia de pago (API):</span>
              #{{ result().pagoId }} — usar en webhook o confirmación manual con cabecera X-Billing-Secret.
            </p>
          }
          @if (result().compraId != null) {
            <p class="mt-1">
              <span class="font-semibold text-primary">Compra:</span>
              #{{ result().compraId }}
            </p>
          }
        </div>
      }
      @if (result().purchasePin) {
        <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wide text-secondary">PIN de compra / referencia</p>
          <p class="mt-2 font-mono text-lg font-semibold tracking-widest text-primary">{{ result().purchasePin }}</p>
          <p class="mt-1 text-xs text-secondary">Solo referencia operativa; no sustituye la autenticación.</p>
        </div>
      }
    </div>

    <div class="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      @if (result().nextStep === 'LOGIN') {
        <app-ui-button variant="gradient" class="sm:flex-1" routerLink="/login">Ir a iniciar sesión</app-ui-button>
        <app-ui-button variant="secondary" class="sm:flex-1" routerLink="/app">Abrir panel</app-ui-button>
      } @else if (result().nextStep === 'PAYMENT') {
        <app-ui-button variant="gradient" class="sm:flex-1" routerLink="/login">Ir a login (tras activación)</app-ui-button>
        <app-ui-button variant="secondary" class="sm:flex-1" routerLink="/landing">Volver al inicio</app-ui-button>
      } @else {
        <app-ui-button variant="gradient" routerLink="/login">Continuar</app-ui-button>
      }
    </div>
  `
})
export class RegisterStepResultComponent {
  readonly result = input.required<OnboardingRegisterResponseDto>();
}
