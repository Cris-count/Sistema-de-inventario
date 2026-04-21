import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../core/api/categoria.service';
import { Categoria } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-categorias',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <h1>Categorías</h1>
          <p class="page-lead">
            Agrupa productos para filtros, informes y un catálogo ordenado. Cada producto debe tener una categoría antes de
            usarse en movimientos.
          </p>
        </div>
        <div class="page-header__actions">
          <button type="button" class="btn btn-primary" (click)="startCreate()">Nueva categoría</button>
        </div>
      </header>

      <div class="page-body">
        @if (error()) {
          <div class="alert alert-error" role="alert">
            {{ error() }}
            <app-plan-block-followup [followup]="planFollowup()" />
          </div>
        } @else if (message()) {
          <div class="alert alert-success" role="status">{{ message() }}</div>
        }

        @if (formMode()) {
          <section id="formulario-categoria" class="card card--action stack stack--tight">
            <div>
              <p class="card-eyebrow">{{ formMode() === 'create' ? 'Alta' : 'Edición' }}</p>
              <h2 class="ds-section-title" style="margin-bottom: 0.35rem">
                {{ formMode() === 'create' ? 'Registrar categoría' : 'Editar categoría' }}
              </h2>
              <p class="field-hint" style="margin: 0; max-width: 62ch">
                {{
                  formMode() === 'create'
                    ? 'El nombre se mostrará al clasificar productos. La descripción es opcional y ayuda al equipo.'
                    : 'Los cambios se reflejan de inmediato en el catálogo y en productos que usen esta categoría.'
                }}
              </p>
            </div>

            <form [formGroup]="form" (ngSubmit)="save()" class="form-stack form-stack--tight">
              <fieldset class="form-section">
                <legend class="form-section__legend">Datos de la categoría</legend>
                <div class="form-grid form-grid--2">
                  <div class="field" [class.field--error]="form.controls.nombre.invalid && form.controls.nombre.touched">
                    <label for="cat-nombre">Nombre</label>
                    <input
                      id="cat-nombre"
                      formControlName="nombre"
                      type="text"
                      autocomplete="off"
                      placeholder="Ej. Bebidas, Repuestos…"
                    />
                    @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
                      <p class="field-error">El nombre es obligatorio.</p>
                    }
                  </div>
                  <div class="field form-grid__full">
                    <label for="cat-desc">Descripción (opcional)</label>
                    <textarea
                      id="cat-desc"
                      formControlName="descripcion"
                      rows="2"
                      placeholder="Nota interna o criterio de clasificación"
                    ></textarea>
                    <p class="field-hint">Visible en esta vista; sirve como contexto para quien administra el catálogo.</p>
                  </div>
                </div>
              </fieldset>

              <div class="form-actions form-actions--start" style="margin-top: 0">
                <button type="submit" class="btn btn-primary" [class.is-loading]="saving()" [disabled]="saving() || form.invalid">
                  @if (saving()) {
                    <span class="spinner" aria-hidden="true"></span>
                    Guardando…
                  } @else {
                    {{ formMode() === 'create' ? 'Guardar categoría' : 'Guardar cambios' }}
                  }
                </button>
                <button type="button" class="btn btn-text" [disabled]="saving()" (click)="cancelForm(true)">Cancelar</button>
              </div>
            </form>
          </section>
        }

        <section class="stack stack--tight" aria-labelledby="categorias-listado-title">
          <div class="table-toolbar">
            <h2 id="categorias-listado-title" class="ds-section-title" style="margin: 0; flex: 1 1 100%; width: 100%">
              Listado
            </h2>
            <div class="table-toolbar__search">
              <div class="field">
                <label for="cat-buscar">Buscar</label>
                <input
                  id="cat-buscar"
                  name="catBuscar"
                  type="search"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  autocomplete="off"
                  placeholder="Nombre o descripción…"
                  [disabled]="loading() || rows().length === 0"
                />
                <p class="field-hint">Filtra sobre la lista cargada desde el servidor.</p>
              </div>
            </div>
            <div class="table-toolbar__filters">
              <div class="field">
                <label for="cat-filtro-estado">Estado</label>
                <select
                  id="cat-filtro-estado"
                  name="catEstado"
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
              Mostrando <strong>{{ displayRows().length }}</strong> de <strong>{{ rows().length }}</strong> categorías.
            </p>
          }

          <div class="table-wrap" [attr.aria-busy]="loading()">
            @if (loading()) {
              <div class="table-loading">
                <span class="spinner" aria-hidden="true"></span>
                Cargando categorías…
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
                <p class="table-empty__title">Aún no hay categorías</p>
                <p class="table-empty__hint">
                  Crea la primera con <strong>Nueva categoría</strong> para poder asignarla a productos.
                </p>
                <button type="button" class="btn btn-primary" style="margin-top: var(--space-ds-4)" (click)="startCreate()">
                  Nueva categoría
                </button>
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
                    <th scope="col">Nombre</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Estado</th>
                    <th scope="col" class="data-actions"><span class="visually-hidden">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of displayRows(); track c.id) {
                    <tr>
                      <td>
                        <span class="cat-nombre">{{ c.nombre }}</span>
                      </td>
                      <td>
                        @if (c.descripcion?.trim()) {
                          <span class="table-cell-muted">{{ c.descripcion }}</span>
                        } @else {
                          <span class="table-cell-muted">—</span>
                        }
                      </td>
                      <td>
                        <span class="badge" [class.badge-active]="c.activo" [class.badge-inactive]="!c.activo">{{
                          c.activo ? 'Activa' : 'Inactiva'
                        }}</span>
                      </td>
                      <td class="data-actions">
                        <div class="table-actions">
                          <button type="button" class="btn btn-text" (click)="startEdit(c)">Editar</button>
                        </div>
                      </td>
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
    .cat-nombre {
      font-weight: var(--font-weight-semibold);
      font-size: var(--text-body-sm);
      letter-spacing: var(--tracking-tight);
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
export class CategoriasPage implements OnInit {
  private readonly api = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly rows = signal<Categoria[]>([]);
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
      list = list.filter((c) => c.activo);
    } else if (est === 'inactivas') {
      list = list.filter((c) => !c.activo);
    }
    if (q) {
      list = list.filter((c) => {
        const nombre = c.nombre?.toLowerCase() ?? '';
        const desc = (c.descripcion ?? '').toLowerCase();
        return nombre.includes(q) || desc.includes(q);
      });
    }
    return list;
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: ['']
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
      globalThis.document.getElementById('formulario-categoria')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
    this.formMode.set('create');
    this.editingId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    this.scrollFormIntoView();
  }

  startEdit(c: Categoria): void {
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
    this.formMode.set('edit');
    this.editingId.set(c.id);
    this.form.patchValue({ nombre: c.nombre, descripcion: c.descripcion ?? '' });
    this.scrollFormIntoView();
  }

  cancelForm(clearFeedback = false): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    if (clearFeedback) {
      this.message.set(null);
      this.error.set(null);
      this.planFollowup.set(null);
    }
  }

  save(): void {
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
            ? 'Categoría creada. Ya puedes asignarla al dar de alta o editar productos.'
            : 'Cambios guardados en la categoría.'
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
