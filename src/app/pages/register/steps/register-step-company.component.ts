import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EmpresaForm } from '../register.models';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-register-step-company',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <div class="space-y-2">
      <h2 class="text-xl font-semibold tracking-tight text-primary dark:text-slate-100">2. Datos de la empresa</h2>
      <p class="text-sm text-secondary dark:text-slate-400">Identificación única (NIT, RUC, etc.) y datos de contacto.</p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <label class="block sm:col-span-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">Nombre comercial</span>
        <input
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35 dark:placeholder:text-slate-500"
          [value]="value().nombre"
          (input)="patch.emit({ nombre: inputVal($event) })"
        />
      </label>

      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">Identificación tributaria</span>
        <input
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35 dark:placeholder:text-slate-500"
          [value]="value().identificacion"
          (input)="patch.emit({ identificacion: inputVal($event) })"
          autocomplete="off"
        />
      </label>

      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">Sector / tipo</span>
        <select
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35"
          [value]="value().sector"
          (change)="patch.emit({ sector: selectVal($event) })"
        >
          <option value="">Selecciona un sector</option>
          @for (sector of sectores; track sector) {
            <option [value]="sector">{{ sector }}</option>
          }
        </select>
      </label>

      <label class="block sm:col-span-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">Correo de contacto</span>
        <input
          type="email"
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35 dark:placeholder:text-slate-500"
          [value]="value().emailContacto"
          (input)="patch.emit({ emailContacto: inputVal($event) })"
        />
      </label>

      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">Teléfono</span>
        <input
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35 dark:placeholder:text-slate-500"
          [value]="value().telefono"
          (input)="patch.emit({ telefono: inputVal($event) })"
        />
      </label>

      <label class="block">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">País</span>
        <select
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35"
          [value]="value().pais"
          (change)="onPaisChange($event)"
        >
          <option value="">Selecciona un país</option>
          @for (pais of paises; track pais) {
            <option [value]="pais">{{ pais }}</option>
          }
        </select>
      </label>

      <label class="block sm:col-span-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-secondary dark:text-slate-400">Ciudad</span>
        <select
          class="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm text-primary outline-none ring-accent/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-accent/35"
          [value]="value().ciudad"
          (change)="patch.emit({ ciudad: selectVal($event) })"
          [disabled]="!value().pais"
        >
          <option value="">{{ value().pais ? 'Selecciona una ciudad' : 'Primero selecciona un país' }}</option>
          @for (ciudad of ciudadesDisponibles(); track ciudad) {
            <option [value]="ciudad">{{ ciudad }}</option>
          }
        </select>
      </label>
    </div>

    @if (hint()) {
      <p class="mt-4 text-sm text-amber-800 dark:text-amber-200">{{ hint() }}</p>
    }

    <div class="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <app-ui-button variant="outline" class="w-full sm:w-auto sm:min-w-[11rem]" (click)="back.emit()">
        Atrás: verificar correo
      </app-ui-button>
      <app-ui-button variant="gradient" class="w-full sm:w-auto sm:min-w-[14rem]" (click)="next.emit()">
        Siguiente: super administrador
      </app-ui-button>
    </div>
  `
})
export class RegisterStepCompanyComponent {
  readonly value = input.required<EmpresaForm>();
  readonly hint = input<string | null>(null);
  readonly patch = output<Partial<EmpresaForm>>();
  readonly next = output<void>();
  readonly back = output<void>();

  protected readonly sectores = [
    'Tienda / retail',
    'Ferretería',
    'Papelería',
    'Droguería',
    'Minimercado',
    'Moda / confecciones',
    'Repuestos',
    'Tecnología',
    'Distribuidora / mayorista',
    'Manufactura',
    'Restaurante / insumos',
    'Otro'
  ];

  protected readonly paises = ['Colombia'];

  protected readonly ciudadesPorPais: Record<string, string[]> = {
    Colombia: [
      'Armenia',
      'Bogotá',
      'Medellín',
      'Cali',
      'Barranquilla',
      'Bucaramanga',
      'Pereira',
      'Manizales',
      'Cartagena',
      'Cúcuta',
      'Ibagué',
      'Santa Marta',
      'Villavicencio',
      'Pasto',
      'Montería'
    ]
  };

  protected readonly ciudadesDisponibles = computed(() => {
    const pais = this.value().pais;
    return this.ciudadesPorPais[pais] ?? [];
  });

  protected inputVal(ev: Event): string {
    return (ev.target as HTMLInputElement).value;
  }

  protected selectVal(ev: Event): string {
    return (ev.target as HTMLSelectElement).value;
  }

  protected onPaisChange(ev: Event): void {
    const pais = this.selectVal(ev);
    this.patch.emit({
      pais,
      ciudad: ''
    });
  }
}