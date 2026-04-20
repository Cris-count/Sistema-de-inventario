import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { PublicPlanDto } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-register-step-email-verify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary">2. Verifica tu correo</h2>
      <p class="text-sm text-secondary">
        Usaremos este correo para el super administrador. Te enviamos un código de 6 dígitos para confirmar que es tuyo
        (en desarrollo el mensaje aparece en el log del servidor).
      </p>
    </div>

    @if (plan(); as pl) {
      <p class="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2 text-sm text-secondary">
        Plan seleccionado: <span class="font-semibold text-primary">{{ pl.nombre }}</span>
      </p>
    }

    <div class="mt-6 space-y-4">
      <label class="block text-sm font-medium text-primary">
        Correo electrónico
        <input
          type="email"
          autocomplete="email"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          [value]="email()"
          (input)="onEmailChange($event)"
          [disabled]="verified()"
        />
      </label>

      <div class="flex flex-wrap items-center gap-3">
        <app-ui-button
          variant="outline"
          class="min-w-[10.5rem]"
          [disabled]="sending() || !emailLooksValid() || verified()"
          (click)="requestCode.emit()"
        >
          {{ sending() ? 'Enviando…' : 'Enviar código al correo' }}
        </app-ui-button>
        @if (codeSent()) {
          <span class="self-center text-xs text-secondary">Revisa tu bandeja (o el log de la API).</span>
        }
      </div>

      <label class="block text-sm font-medium text-primary">
        Código de 6 dígitos
        <input
          type="text"
          inputmode="numeric"
          maxlength="6"
          pattern="[0-9]*"
          class="mt-1 w-full max-w-xs rounded-xl border border-slate-200 bg-surface px-3 py-2 font-mono text-lg tracking-widest text-primary shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          [value]="code()"
          (input)="onCodeChange($event)"
          [disabled]="verified()"
        />
      </label>
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <app-ui-button variant="outline" class="w-full sm:w-auto sm:min-w-[11rem]" (click)="back.emit()">
        Atrás: elegir plan
      </app-ui-button>
      <app-ui-button
        variant="gradient"
        class="w-full sm:w-auto sm:min-w-[12rem]"
        [disabled]="!canContinue()"
        (click)="advance.emit()"
      >
        {{ verified() ? 'Siguiente: datos de empresa' : 'Confirmar código y continuar' }}
      </app-ui-button>
    </div>
  `
})
export class RegisterStepEmailVerifyComponent {
  readonly plan = input<PublicPlanDto | null>(null);
  readonly email = input<string>('');
  readonly code = input<string>('');
  readonly hint = input<string | null>(null);
  readonly sending = input(false);
  readonly verifying = input(false);
  readonly verified = input(false);
  readonly codeSent = input(false);

  readonly emailInput = output<string>();
  readonly codeInput = output<string>();
  readonly requestCode = output<void>();
  readonly advance = output<void>();
  readonly back = output<void>();

  emailLooksValid(): boolean {
    const e = this.email().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  canContinue(): boolean {
    if (this.verified()) {
      return true;
    }
    return this.emailLooksValid() && /^\d{6}$/.test(this.code().trim()) && !this.verifying();
  }

  onEmailChange(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.emailInput.emit(v);
  }

  onCodeChange(ev: Event): void {
    const v = (ev.target as HTMLInputElement).value;
    this.codeInput.emit(v);
  }
}
