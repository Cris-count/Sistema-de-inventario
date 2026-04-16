import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { SuperAdminForm } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-register-step-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary">4. Super administrador</h2>
      <p class="text-sm text-secondary">
        Será el responsable principal de la cuenta empresarial (rol SUPER_ADMIN). No reemplaza los roles operativos del inventario.
      </p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary">Nombre</span>
        <input
          class="mt-1 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm text-primary outline-none ring-teal-500/30 focus:ring-2"
          [value]="value().nombre"
          (input)="patch.emit({ nombre: inputVal($event) })"
        />
      </label>
      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary">Apellido</span>
        <input
          class="mt-1 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm text-primary outline-none ring-teal-500/30 focus:ring-2"
          [value]="value().apellido"
          (input)="patch.emit({ apellido: inputVal($event) })"
        />
      </label>
      <label class="block sm:col-span-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary">Correo (inicio de sesión)</span>
        <input
          type="email"
          autocomplete="email"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm text-primary outline-none ring-teal-500/30 focus:ring-2"
          [value]="value().email"
          (input)="patch.emit({ email: inputVal($event) })"
        />
      </label>
      <label class="block sm:col-span-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary">Contraseña (mín. 8 caracteres)</span>
        <input
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm text-primary outline-none ring-teal-500/30 focus:ring-2"
          [value]="value().password"
          (input)="patch.emit({ password: inputVal($event) })"
        />
      </label>
      <label class="block sm:col-span-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary">Confirmar contraseña</span>
        <input
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm text-primary outline-none ring-teal-500/30 focus:ring-2"
          [value]="value().confirmPassword"
          (input)="patch.emit({ confirmPassword: inputVal($event) })"
        />
      </label>
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <app-ui-button variant="outline" class="w-full sm:w-auto sm:min-w-[11rem]" (click)="back.emit()">
        Atrás: datos de empresa
      </app-ui-button>
      <app-ui-button variant="gradient" class="w-full sm:w-auto sm:min-w-[12rem]" (click)="next.emit()">
        Siguiente: revisar y confirmar
      </app-ui-button>
    </div>
  `
})
export class RegisterStepAdminComponent {
  readonly value = input.required<SuperAdminForm>();
  readonly hint = input<string | null>(null);
  readonly patch = output<Partial<SuperAdminForm>>();
  readonly next = output<void>();
  readonly back = output<void>();

  protected inputVal(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }
}
