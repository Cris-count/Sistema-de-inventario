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

    <div class="mt-5 rounded-2xl border p-4 text-sm" [class]="state().statusContainerClass">
      <p class="text-xs font-semibold uppercase tracking-wide" [class]="state().statusLabelClass">
        Estado de tu registro
      </p>
      <p class="mt-2 text-base font-semibold text-primary dark:text-slate-100">{{ state().statusTitle }}</p>
      <p class="mt-1 text-sm text-secondary dark:text-slate-400">{{ state().statusDescription }}</p>
      <p class="mt-3 text-sm font-medium text-primary dark:text-slate-100">{{ state().nextAction }}</p>
    </div>

    <div
      class="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-surface p-5 text-sm shadow-soft dark:border-slate-600 dark:bg-slate-900/90"
    >
      <div class="flex flex-wrap justify-between gap-2">
        <span class="text-secondary dark:text-slate-400">Empresa</span>
        <span class="font-medium text-primary dark:text-slate-100">{{ result().empresaNombre }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        <span class="text-secondary dark:text-slate-400">Super admin</span>
        <span class="font-medium text-primary dark:text-slate-100">{{ result().superAdminEmail }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        <span class="text-secondary dark:text-slate-400">Plan</span>
        <span class="font-medium text-primary dark:text-slate-100">{{ result().planNombre }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        <span class="text-secondary dark:text-slate-400">Acceso al sistema</span>
        <span class="font-medium text-primary dark:text-slate-100">{{ state().accessLabel }}</span>
      </div>
      <div class="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        <span class="text-secondary dark:text-slate-400">Estado de la cuenta</span>
        <span class="font-medium text-primary dark:text-slate-100">{{ state().accountLabel }}</span>
      </div>

      @if (paymentReference(); as ref) {
        <div
          class="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-secondary dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400"
        >
          <p>
            <span class="font-semibold text-primary dark:text-slate-100">Referencia de pago:</span>
            {{ ref }}
          </p>
          <p class="mt-1">Compártela solo para seguimiento del cobro o validación manual.</p>
          <div class="mt-2">
            <app-ui-button variant="secondary" size="sm" (click)="copyReference(ref)">Copiar referencia</app-ui-button>
          </div>
          @if (copyFeedback(); as feedback) {
            <p class="mt-2 text-[11px] font-medium text-primary dark:text-slate-100">{{ feedback }}</p>
          }
        </div>
      }

      @if (result().purchasePin) {
        <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-slate-800/80 dark:ring-slate-700">
          <p class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">PIN de seguimiento</p>
          <p class="mt-2 font-mono text-lg font-semibold tracking-widest text-primary dark:text-slate-100">
            {{ result().purchasePin }}
          </p>
          <p class="mt-1 text-xs text-secondary dark:text-slate-400">
            Es una referencia de soporte para seguimiento. No habilita acceso ni reemplaza el inicio de sesión.
          </p>
        </div>
      }

      @if (!canLogin()) {
        <div
          class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/45 dark:text-amber-100"
        >
          Tu cuenta aún no está habilitada para entrar al sistema. Cuando se confirme la activación, podrás iniciar sesión.
        </div>
      }
    </div>

    <div class="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      @if (canLogin()) {
        <app-ui-button variant="gradient" class="sm:flex-1" linkTo="/login">Iniciar sesión</app-ui-button>
        <app-ui-button variant="secondary" class="sm:flex-1" linkTo="/landing">Volver al inicio</app-ui-button>
      } @else {
        <app-ui-button variant="secondary" class="sm:flex-1" type="button" [disabled]="true">Esperando activación</app-ui-button>
        <app-ui-button variant="secondary" class="sm:flex-1" linkTo="/landing">Volver al inicio</app-ui-button>
      }
    </div>
  `
})
export class RegisterStepResultComponent {
  readonly result = input.required<OnboardingRegisterResponseDto>();
  readonly copyFeedback = signal<string | null>(null);

  readonly canLogin = computed(() => this.result().nextStep === 'LOGIN');

  readonly paymentReference = computed(() => {
    const r = this.result();
    if (r.pagoId != null) return `PAGO-${r.pagoId}`;
    if (r.compraId != null) return `COMPRA-${r.compraId}`;
    return null;
  });

  readonly state = computed(() => {
    const r = this.result();
    if (r.nextStep === 'PAYMENT') {
      return {
        headline: 'Tu registro fue creado, pero aún falta la activación de la cuenta.',
        statusTitle: 'Registro pendiente de activación por pago',
        statusDescription: 'Completa o valida el pago para habilitar el acceso del usuario administrador.',
        nextAction: 'Siguiente paso: usa la referencia de pago para seguimiento y espera la confirmación.',
        accessLabel: 'Aún no disponible',
        accountLabel: 'Pendiente de pago / activación',
        statusContainerClass:
          'border-amber-200 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/50',
        statusLabelClass: 'text-amber-900 dark:text-amber-200'
      };
    }

    if (r.suscripcionEstado === 'TRIAL' || r.activationOutcome === 'TRIAL_STARTED') {
      return {
        headline: 'Tu empresa quedó creada en periodo de prueba. Ya puedes ingresar con tu correo administrador.',
        statusTitle: 'Cuenta en periodo de prueba',
        statusDescription: 'Tienes acceso habilitado para iniciar operación y validar el sistema.',
        nextAction: 'Siguiente paso: inicia sesión y completa la configuración inicial.',
        accessLabel: 'Disponible ahora',
        accountLabel: 'Prueba activa',
        statusContainerClass:
          'border-cyan-200 bg-cyan-50 dark:border-cyan-500/40 dark:bg-cyan-950/50',
        statusLabelClass: 'text-cyan-900 dark:text-cyan-200'
      };
    }

    return {
      headline: 'Tu cuenta quedó creada y activa. Ya puedes iniciar sesión.',
      statusTitle: 'Cuenta activa',
      statusDescription: 'Tu acceso está habilitado para entrar al sistema.',
      nextAction: 'Siguiente paso: inicia sesión con tu correo administrador.',
      accessLabel: 'Disponible ahora',
      accountLabel: 'Activa',
      statusContainerClass:
        'border-emerald-200 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/50',
      statusLabelClass: 'text-emerald-900 dark:text-emerald-200'
    };
  });

  async copyReference(reference: string): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API not available');
      }
      await navigator.clipboard.writeText(reference);
      this.copyFeedback.set('Referencia copiada.');
    } catch {
      this.copyFeedback.set('No se pudo copiar automáticamente. Cópiala manualmente.');
    }
    setTimeout(() => this.copyFeedback.set(null), 2400);
  }
}
