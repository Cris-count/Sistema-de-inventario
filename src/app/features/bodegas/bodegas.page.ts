import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { AuthService } from '../../core/auth/auth.service';
import { Bodega } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-bodegas',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <h1>Bodegas</h1>
          <app-dismissible-hint hintId="bodegas.pageIntro" persist="local" variant="flush">
            <p class="page-lead">
              Puntos de almacenamiento donde vive el stock: cada movimiento y el inventario referencian una bodega. El código
              debe ser único en tu empresa.
            </p>
          </app-dismissible-hint>
        </div>
        @if (canGestionarBodegas()) {
          <div class="page-header__actions">
            <button type="button" class="btn btn-primary" (click)="startCreate()">Nueva bodega</button>
          </div>
        }
      </header>

      <div class="page-body">
        @if (esSoloConsultaBodegas()) {
          <app-dismissible-hint hintId="bodegas.notaSoloConsulta" persist="local">
            <div class="alert alert-info" role="note">
              <strong>Solo consulta:</strong> tu rol puede ver bodegas y usarlas en inventario y movimientos. Alta y edición las
              realizan <strong>Administración</strong> (según política del servidor).
            </div>
          </app-dismissible-hint>
        }

        @if (error()) {
          <div class="alert alert-error" role="alert">
            {{ error() }}
            <app-plan-block-followup [followup]="planFollowup()" />
          </div>
        } @else if (message()) {
          <div class="alert alert-success" role="status">{{ message() }}</div>
        }

        @if (canGestionarBodegas() && formMode()) {
          <section id="formulario-bodega" class="card card--action stack stack--tight">
            <div>
              <p class="card-eyebrow">{{ formMode() === 'create' ? 'Alta' : 'Edición' }}</p>
              <h2 class="ds-section-title" style="margin-bottom: 0.35rem">
                {{ formMode() === 'create' ? 'Registrar bodega' : 'Editar bodega' }}
              </h2>
              <p class="field-hint" style="margin: 0; max-width: 62ch">
                {{
                  formMode() === 'create'
                    ? 'Define código y nombre para identificar la ubicación en transferencias, entradas y existencias.'
                    : 'Los cambios se aplican de inmediato para todos los usuarios que operen esta bodega.'
                }}
              </p>
            </div>

            <form [formGroup]="form" (ngSubmit)="save()" class="form-stack form-stack--tight">
              <fieldset class="form-section">
                <legend class="form-section__legend">Identificación</legend>
                <p class="form-section__hint">Código corto único y nombre visible en listas y movimientos.</p>
                <div class="form-grid form-grid--2">
                  <div class="field" [class.field--error]="form.controls.codigo.invalid && form.controls.codigo.touched">
                    <label for="bod-codigo">Código</label>
                    <input
                      id="bod-codigo"
                      formControlName="codigo"
                      type="text"
                      autocomplete="off"
                      placeholder="Ej. PRINCIPAL, SEDE-NORTE"
                    />
                    @if (form.controls.codigo.invalid && form.controls.codigo.touched) {
                      <p class="field-error">El código es obligatorio.</p>
                    }
                  </div>
                  <div class="field" [class.field--error]="form.controls.nombre.invalid && form.controls.nombre.touched">
                    <label for="bod-nombre">Nombre</label>
                    <input id="bod-nombre" formControlName="nombre" type="text" autocomplete="off" placeholder="Nombre de la ubicación" />
                    @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
                      <p class="field-error">El nombre es obligatorio.</p>
                    }
                  </div>
                </div>
              </fieldset>

              <fieldset class="form-section">
                <legend class="form-section__legend">Ubicación</legend>
                <div class="form-grid">
                  <div class="field form-grid__full">
                    <label for="bod-dir">Dirección u observación de ubicación (opcional)</label>
                    <input
                      id="bod-dir"
                      formControlName="direccion"
                      type="text"
                      autocomplete="street-address"
                      placeholder="Dirección, ciudad, referencia interna…"
                    />
                    <p class="field-hint">
                      Ayuda al equipo a distinguir sedes; no sustituye datos de contacto de la empresa en
                      <strong>Mi empresa</strong>.
                    </p>
                  </div>
                </div>
              </fieldset>

              <div class="form-actions form-actions--start" style="margin-top: 0">
                <button type="submit" class="btn btn-primary" [class.is-loading]="saving()" [disabled]="saving() || form.invalid">
                  @if (saving()) {
                    <span class="spinner" aria-hidden="true"></span>
                    Guardando…
                  } @else {
                    {{ formMode() === 'create' ? 'Guardar bodega' : 'Guardar cambios' }}
                  }
                </button>
                <button type="button" class="btn btn-text" [disabled]="saving()" (click)="cancelForm(true)">Cancelar</button>
              </div>
            </form>
          </section>
        }

        <section class="stack stack--tight" aria-labelledby="bodegas-listado-title">
          <div class="table-toolbar">
            <h2 id="bodegas-listado-title" class="ds-section-title" style="margin: 0; flex: 1 1 100%; width: 100%">
              Listado
            </h2>
            <div class="table-toolbar__search">
              <div class="field">
                <label for="bod-buscar">Buscar</label>
                <input
                  id="bod-buscar"
                  name="bodBuscar"
                  type="search"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  autocomplete="off"
                  placeholder="Código, nombre o dirección…"
                  [disabled]="loading() || rows().length === 0"
                />
                <p class="field-hint">Filtra sobre la lista cargada desde el servidor.</p>
              </div>
            </div>
            <div class="table-toolbar__filters">
              <div class="field">
                <label for="bod-filtro-estado">Estado</label>
                <select
                  id="bod-filtro-estado"
                  name="bodEstado"
                  [ngModel]="estadoFiltro()"
                  (ngModelChange)="onEstadoFiltro($event)"
                  [disabled]="loading() || rows().length === 0"
                >
                  <option value="todos">Todas</option>
                  <option value="activas">Solo activas</option>
                  <option value="inactivas">Solo inactivas</option>
                </select>
              </div>
            </div>
          </div>

          @if (!loading() && rows().length > 0 && (searchQuery().trim() || estadoFiltro() !== 'todos')) {
            <p class="muted" style="margin: 0">
              Mostrando <strong>{{ displayRows().length }}</strong> de <strong>{{ rows().length }}</strong> bodegas.
            </p>
          }

          <div class="table-wrap" [attr.aria-busy]="loading()">
            @if (loading()) {
              <div class="table-loading">
                <span class="spinner" aria-hidden="true"></span>
                Cargando bodegas…
              </div>
            } @else if (error() && rows().length === 0) {
              <div class="table-empty" role="status">
                <p class="table-empty__title">No se pudo cargar el listado</p>
                <p class="table-empty__hint">Revisa el mensaje arriba o intenta de nuevo.</p>
                <button
                  type="button"
                  class="btn btn-secondary"
                  style="margin-top: var(--space-ds-4)"
                  [disabled]="loading()"
                  (click)="reload()"
                >
                  Reintentar
                </button>
              </div>
            } @else if (rows().length === 0) {
              <div class="table-empty" role="status">
                <p class="table-empty__title">Aún no hay bodegas registradas</p>
                <p class="table-empty__hint">
                  @if (canGestionarBodegas()) {
                    Crea la primera con <strong>Nueva bodega</strong> para empezar a mover stock.
                  } @else {
                    Cuando administración registre ubicaciones, aparecerán aquí para consulta y operación.
                  }
                </p>
                @if (canGestionarBodegas()) {
                  <button type="button" class="btn btn-primary" style="margin-top: var(--space-ds-4)" (click)="startCreate()">
                    Nueva bodega
                  </button>
                }
              </div>
            } @else if (displayRows().length === 0) {
              <div class="table-empty" role="status">
                <p class="table-empty__title">Nada coincide con el filtro</p>
                <p class="table-empty__hint">Prueba otra búsqueda o cambia el filtro de estado.</p>
              </div>
            } @else {
              <table class="data table-zebra">
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Ubicación</th>
                    <th scope="col">Estado</th>
                    @if (canGestionarBodegas()) {
                      <th scope="col" class="data-actions"><span class="visually-hidden">Acciones</span></th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (b of displayRows(); track b.id) {
                    <tr>
                      <td>
                        <span class="bod-codigo">{{ b.codigo }}</span>
                      </td>
                      <td>{{ b.nombre }}</td>
                      <td>
                        @if (b.direccion?.trim()) {
                          <span class="table-cell-muted">{{ b.direccion }}</span>
                        } @else {
                          <span class="table-cell-muted">—</span>
                        }
                      </td>
                      <td>
                        <span class="badge" [class.badge-active]="b.activo" [class.badge-inactive]="!b.activo">{{
                          b.activo ? 'Activa' : 'Inactiva'
                        }}</span>
                      </td>
                      @if (canGestionarBodegas()) {
                        <td class="data-actions">
                          <div class="table-actions">
                            <button type="button" class="btn btn-text" (click)="startEdit(b)">Editar</button>
                          </div>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    .bod-codigo {
      font-weight: var(--font-weight-semibold);
      font-size: var(--text-body-sm);
      letter-spacing: 0.04em;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `
})
export class BodegasPage implements OnInit {
  private readonly api = inject(BodegaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  /** Alta y edición: solo administración (alineado con @PreAuthorize en API). */
  readonly canGestionarBodegas = () => this.auth.hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  /** Roles que ven el listado pero no el formulario de mantenimiento. */
  readonly esSoloConsultaBodegas = () =>
    !this.canGestionarBodegas() && this.auth.hasAnyRole(['AUX_BODEGA', 'COMPRAS', 'GERENCIA']);

  readonly loading = signal(false);
  readonly rows = signal<Bodega[]>([]);
  readonly formMode = signal<'create' | 'edit' | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly searchQuery = signal('');
  readonly estadoFiltro = signal<'todos' | 'activas' | 'inactivas'>('todos');

  readonly displayRows = computed(() => {
    let list = this.rows();
    const q = this.searchQuery().trim().toLowerCase();
    const est = this.estadoFiltro();
    if (est === 'activas') {
      list = list.filter((b) => b.activo);
    } else if (est === 'inactivas') {
      list = list.filter((b) => !b.activo);
    }
    if (q) {
      list = list.filter((b) => {
        const cod = b.codigo?.toLowerCase() ?? '';
        const nom = b.nombre?.toLowerCase() ?? '';
        const dir = (b.direccion ?? '').toLowerCase();
        return cod.includes(q) || nom.includes(q) || dir.includes(q);
      });
    }
    return list;
  });

  readonly form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    direccion: ['']
  });

  ngOnInit(): void {
    this.reload();
  }

  onEstadoFiltro(v: string): void {
    if (v === 'activas' || v === 'inactivas' || v === 'todos') {
      this.estadoFiltro.set(v);
    }
  }

  private scrollFormIntoView(): void {
    queueMicrotask(() =>
      globalThis.document.getElementById('formulario-bodega')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.loading.set(false)
    });
  }

  startCreate(): void {
    if (!this.canGestionarBodegas()) return;
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.reset({ codigo: '', nombre: '', direccion: '' });
    this.scrollFormIntoView();
  }

  startEdit(b: Bodega): void {
    if (!this.canGestionarBodegas()) return;
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
    this.formMode.set('edit');
    this.editingId.set(b.id);
    this.form.patchValue({ codigo: b.codigo, nombre: b.nombre, direccion: b.direccion ?? '' });
    this.scrollFormIntoView();
  }

  cancelForm(clearFeedback = false): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset({ codigo: '', nombre: '', direccion: '' });
    if (clearFeedback) {
      this.message.set(null);
      this.error.set(null);
      this.planFollowup.set(null);
    }
  }

  save(): void {
    if (!this.canGestionarBodegas()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    const v = this.form.getRawValue();
    const id = this.editingId();
    const esAlta = this.formMode() === 'create';
    const req = id ? this.api.update(id, v) : this.api.create(v);
    req.subscribe({
      next: () => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set(
          esAlta
            ? 'Bodega registrada. Ya puedes usarla en inventario, entradas y transferencias.'
            : 'Cambios guardados en la bodega.'
        );
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.cancelForm();
        this.reload();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.saving.set(false)
    });
  }
}
