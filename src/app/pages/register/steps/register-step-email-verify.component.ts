import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal
} from '@angular/core';
import type { PublicPlanDto } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

function secretFromOtpauth(uri: string): string | null {
  const m = uri.match(/(?:\?|&)secret=([^&]+)/);
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

@Component({
  selector: 'app-register-step-email-verify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary">2. Configura Google Authenticator</h2>
      <p class="text-sm text-secondary">
        Este correo será el del super administrador. Escaneá el código QR con Google Authenticator (o añadí la cuenta
        manualmente) y luego ingresá el código de 6 dígitos que muestra la app para continuar.
      </p>
    </div>

    @if (plan(); as pl) {
      <p class="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2 text-sm text-secondary dark:border-slate-700/60 dark:bg-slate-900/50">
        Plan seleccionado: <span class="font-semibold text-primary">{{ pl.nombre }}</span>
      </p>
    }

    <div class="mt-6 space-y-4">
      <label class="block text-sm font-medium text-primary">
        Correo electrónico (cuenta en la app)
        <input
          type="email"
          autocomplete="email"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-600 dark:focus:border-teal-500 dark:focus:ring-teal-900/40"
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
          {{ sending() ? 'Preparando…' : 'Generar código QR' }}
        </app-ui-button>
        @if (codeSent() && !sending()) {
          <span class="self-center text-xs text-secondary">Si recargás la página, reutilizamos el mismo vínculo mientras no venza.</span>
        }
      </div>

      @if (codeSent() && otpauthUri()) {
        <div
          class="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900/40"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-secondary">Código QR</p>
          @if (qrError(); as qerr) {
            <p class="mt-2 text-sm text-amber-800 dark:text-amber-200">{{ qerr }}</p>
          } @else if (qrDataUrl(); as src) {
            <div class="mt-3 flex justify-center">
              <img [src]="src" alt="Código QR para Google Authenticator" class="h-56 w-56 rounded-xl bg-white p-2" />
            </div>
          } @else {
            <p class="mt-3 text-sm text-secondary">Generando imagen del QR…</p>
          }
          @if (manualSecret(); as sec) {
            <details class="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-950/40">
              <summary class="cursor-pointer font-medium text-primary">¿No podés escanear? Clave manual</summary>
              <p class="mt-2 break-all font-mono text-xs text-primary">{{ sec }}</p>
              <p class="mt-2 text-xs text-secondary">
                En Google Authenticator: &quot;Añadir cuenta&quot; → &quot;Introducir una clave de configuración&quot;.
              </p>
            </details>
          }
        </div>
      }

      <label class="block text-sm font-medium text-primary">
        Código de 6 dígitos
        <input
          type="text"
          inputmode="numeric"
          maxlength="6"
          pattern="[0-9]*"
          class="mt-1 w-full max-w-xs rounded-xl border border-slate-200 bg-surface px-3 py-2 font-mono text-lg tracking-widest text-primary shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200 dark:border-slate-600 dark:focus:border-teal-500 dark:focus:ring-teal-900/40"
          [value]="code()"
          (input)="onCodeChange($event)"
          [disabled]="verified()"
        />
      </label>
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800 dark:text-amber-200">{{ hint() }}</p>
    }

    <div
      class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-700/60"
    >
      <app-ui-button variant="outline" class="w-full sm:w-auto sm:min-w-[11rem]" (click)="back.emit()">
        Atrás: elegir plan
      </app-ui-button>
      <app-ui-button
        variant="gradient"
        class="w-full sm:w-auto sm:min-w-[12rem]"
        [disabled]="!canContinue()"
        (click)="advance.emit()"
      >
        {{ verified() ? 'Siguiente: datos de empresa' : 'Verificar y continuar' }}
      </app-ui-button>
    </div>
  `
})
export class RegisterStepEmailVerifyComponent {
  readonly plan = input<PublicPlanDto | null>(null);
  readonly email = input<string>('');
  readonly code = input<string>('');
  readonly otpauthUri = input<string | null>(null);
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

  readonly qrDataUrl = signal<string | null>(null);
  readonly qrError = signal<string | null>(null);

  readonly manualSecret = computed(() => {
    const u = this.otpauthUri();
    return u ? secretFromOtpauth(u) : null;
  });

  constructor() {
    effect((onCleanup) => {
      const uri = this.otpauthUri();
      if (!uri) {
        this.qrDataUrl.set(null);
        this.qrError.set(null);
        return;
      }
      this.qrError.set(null);
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      import('qrcode')
        .then((QR) =>
          QR.default.toDataURL(uri, { width: 220, margin: 2, errorCorrectionLevel: 'M' })
        )
        .then((dataUrl) => {
          if (!cancelled) {
            this.qrDataUrl.set(dataUrl);
          }
        })
        .catch(() => {
          if (!cancelled) {
            this.qrDataUrl.set(null);
            this.qrError.set(
              'No se pudo generar la imagen del código QR. Podés usar la clave manual de abajo.'
            );
          }
        });
    });
  }

  emailLooksValid(): boolean {
    const e = this.email().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  canContinue(): boolean {
    if (this.verified()) {
      return true;
    }
    return (
      this.emailLooksValid() &&
      this.codeSent() &&
      /^\d{6}$/.test(this.code().trim()) &&
      !this.verifying()
    );
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
