import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { OnboardingRegisterResponseDto } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-register-step-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary">6. Listo</h2>
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
      @if (result().totpOtpauthUri) {
        <div class="rounded-xl border border-teal-100 bg-teal-50/50 p-4 ring-1 ring-teal-100/80">
          <p class="text-xs font-semibold uppercase tracking-wide text-secondary">Google Authenticator</p>
          <p class="mt-1 text-xs text-secondary">
            Los códigos de un solo uso los genera tu app (TOTP), no el servidor. Escanea el QR o copia el secreto Base32.
          </p>
          @if (totpQrSrc(); as src) {
            <img
              [src]="src"
              width="240"
              height="240"
              alt="Código QR para Google Authenticator"
              class="mx-auto mt-3 rounded-lg border border-slate-200 bg-white p-2"
            />
          }
          @if (result().totpSecretBase32) {
            <p class="mt-3 break-all font-mono text-xs text-primary">{{ result().totpSecretBase32 }}</p>
          }
        </div>
      }
    </div>

    <div class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap">
      @if (result().nextStep === 'LOGIN') {
        <app-ui-button variant="gradient" class="w-full sm:flex-1" to="/login">Iniciar sesión</app-ui-button>
        <app-ui-button variant="outline" class="w-full sm:flex-1" to="/app">Ir al panel (app)</app-ui-button>
      } @else if (result().nextStep === 'PAYMENT') {
        <app-ui-button variant="gradient" class="w-full sm:flex-1" to="/login">Ir a login cuando actives el pago</app-ui-button>
        <app-ui-button variant="outline" class="w-full sm:flex-1" to="/landing">Volver al inicio</app-ui-button>
      } @else {
        <app-ui-button variant="gradient" class="w-full sm:min-w-[12rem]" to="/login">Ir a iniciar sesión</app-ui-button>
      }
    </div>
  `
})
export class RegisterStepResultComponent {
  readonly result = input.required<OnboardingRegisterResponseDto>();

  readonly totpQrSrc = computed(() => {
    const uri = this.result().totpOtpauthUri;
    if (!uri) {
      return null;
    }
    return 'https://quickchart.io/chart?cht=qr&chs=240x240&chl=' + encodeURIComponent(uri);
  });
}
