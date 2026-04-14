import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../core/api/categoria.service';
import { ProductoService, ProductoRequest } from '../../core/api/producto.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROLES_GESTION_PRODUCTOS } from '../../core/auth/app-roles';
import { Producto } from '../../core/models/entities.model';
import { getApiErrorMessage } from '../../core/util/api-error';
import { flashSuccess } from '../../core/util/page-flash';

/** Códigos cortos (VARCHAR 20 en API). Etiquetas para la UI. */
const CATALOGO_UNIDADES: { codigo: string; nombre: string }[] = [
  { codigo: 'UND', nombre: 'Unidad' },
  { codigo: 'KG', nombre: 'Kilogramo' },
  { codigo: 'G', nombre: 'Gramo' },
  { codigo: 'TON', nombre: 'Tonelada' },
  { codigo: 'LB', nombre: 'Libra' },
  { codigo: 'LT', nombre: 'Litro' },
  { codigo: 'ML', nombre: 'Mililitro' },
  { codigo: 'GL', nombre: 'Galón (US)' },
  { codigo: 'M', nombre: 'Metro' },
  { codigo: 'CM', nombre: 'Centímetro' },
  { codigo: 'M2', nombre: 'Metro cuadrado' },
  { codigo: 'M3', nombre: 'Metro cúbico' },
  { codigo: 'CJ', nombre: 'Caja' },
  { codigo: 'PQT', nombre: 'Paquete' },
  { codigo: 'BLT', nombre: 'Balde' },
  { codigo: 'ROLLO', nombre: 'Rollo' },
  { codigo: 'PAR', nombre: 'Par' },
  { codigo: 'DOC', nombre: 'Docena' },
  { codigo: 'HRS', nombre: 'Hora (servicio)' },
  { codigo: 'SERV', nombre: 'Servicio' }
];

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="page stack">
      <header class="page-header">
        <div class="row" style="justify-content:space-between; align-items:center; width:100%">
          <div>
            <h1 style="margin-bottom:0.25rem">Productos</h1>
            <p class="page-lead" style="margin:0">Catálogo corporativo y unidades de medida.</p>
          </div>
          @if (canGestionarProductos()) {
            <button type="button" class="btn btn-primary" (click)="startCreate()">Nuevo producto</button>
          }
        </div>
      </header>
      @if (canGestionarProductos()) {
        <div class="alert alert-info" role="note">
          <strong>Mercancía nueva:</strong> si recibe productos cuyo código aún no está en el catálogo, regístrelos aquí
          antes de cargar existencias o registrar movimientos.
        </div>
      }
      @if (esSoloLecturaProductos()) {
        <div class="alert alert-info" role="note">
          <strong>Solo consulta:</strong> su rol (<strong>{{ auth.role() }}</strong>) puede ver el catálogo. La alta,
          edición y activación de productos la realizan <strong>Administración</strong> o <strong>Auxiliar de bodega</strong>,
          según política del servidor.
        </div>
      }
      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }
      @if (formMode()) {
        <div class="card stack">
          <h2>{{ formMode() === 'create' ? 'Registrar producto nuevo' : 'Editar producto' }}</h2>
          @if (formMode() === 'create') {
            <p class="page-lead" style="margin: 0 0 0.75rem">
              Complete los datos del producto. Al guardarlo quedará disponible para entradas, salidas y existencias.
            </p>
          }
          <form [formGroup]="form" (ngSubmit)="saveProducto()" class="stack">
            <div class="row">
              <div class="field">
                <label>Código</label>
                <input formControlName="codigo" />
              </div>
              <div class="field" style="flex:1; min-width:200px">
                <label>Nombre</label>
                <input formControlName="nombre" />
              </div>
            </div>
            <div class="field">
              <label>Descripción</label>
              <textarea formControlName="descripcion" rows="2"></textarea>
            </div>
            <div class="row">
              <div class="field">
                <label>Categoría</label>
                <select formControlName="categoriaId">
                  <option [ngValue]="0">—</option>
                  @for (c of categorias(); track c.id) {
                    <option [ngValue]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </div>
              <div class="field" style="min-width:220px">
                <label>Unidad de medida</label>
                <select formControlName="unidadMedida">
                  @for (o of unidadesForSelect(); track o.codigo) {
                    <option [value]="o.codigo">{{ o.codigo }} — {{ o.nombre }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Stock mínimo</label>
                <input formControlName="stockMinimo" type="text" />
              </div>
            </div>
            <div class="row">
              <button type="submit" class="btn btn-primary" [disabled]="saving() || form.invalid">Guardar</button>
              <button type="button" class="btn" (click)="cancelForm(true)">Cancelar</button>
            </div>
          </form>
        </div>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Mínimo</th>
              <th>Estado</th>
              @if (canGestionarProductos()) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (p of rows(); track p.id) {
              <tr>
                <td>{{ p.codigo }}</td>
                <td>{{ p.nombre }}</td>
                <td>{{ p.categoria.nombre }}</td>
                <td>{{ p.stockMinimo }}</td>
                <td>
                  <span class="badge" [class.badge-ok]="p.activo" [class.badge-off]="!p.activo">{{
                    p.activo ? 'Activo' : 'Inactivo'
                  }}</span>
                </td>
                @if (canGestionarProductos()) {
                  <td>
                    <button type="button" class="btn btn-ghost" (click)="startEdit(p)">Editar</button>
                    <button type="button" class="btn btn-ghost" (click)="toggleActivo(p)">
                      {{ p.activo ? 'Desactivar' : 'Activar' }}
                    </button>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="row">
        <button type="button" class="btn" [disabled]="page() <= 0 || loading()" (click)="prev()">Anterior</button>
        <span class="muted">Página {{ page() + 1 }}</span>
        <button type="button" class="btn" [disabled]="!hasNext() || loading()" (click)="next()">Siguiente</button>
      </div>
    </div>
  `
})
export class ProductosPage implements OnInit {
  private readonly productoApi = inject(ProductoService);
  private readonly categoriaApi = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  /** ADMIN y auxiliar de bodega pueden dar de alta/editar productos (mercancía nueva). */
  readonly canGestionarProductos = () => this.auth.hasAnyRole(ROLES_GESTION_PRODUCTOS);

  /** COMPRAS y GERENCIA: listado permitido; escritura no (alineado con @PreAuthorize en API). */
  readonly esSoloLecturaProductos = () =>
    this.auth.hasAnyRole(['COMPRAS', 'GERENCIA']) && !this.auth.hasAnyRole(ROLES_GESTION_PRODUCTOS);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly rows = signal<Producto[]>([]);
  readonly categorias = signal<{ id: number; nombre: string }[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly formMode = signal<'create' | 'edit' | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly unidadesForSelect = signal(CATALOGO_UNIDADES);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
    unidadMedida: ['UND'],
    stockMinimo: ['0']
  });

  ngOnInit(): void {
    this.categoriaApi.list().subscribe((c) => this.categorias.set(c));
    this.load();
  }

  hasNext(): boolean {
    return this.page() + 1 < this.totalPages();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productoApi.list(this.page(), 20).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(p.totalPages);
      },
      error: (e) => {
        this.message.set(null);
        this.error.set(getApiErrorMessage(e));
      },
      complete: () => this.loading.set(false)
    });
  }

  prev(): void {
    this.message.set(null);
    this.page.update((n) => Math.max(0, n - 1));
    this.load();
  }

  next(): void {
    this.message.set(null);
    this.page.update((n) => n + 1);
    this.load();
  }

  startCreate(): void {
    this.message.set(null);
    this.error.set(null);
    this.formMode.set('create');
    this.editingId.set(null);
    this.unidadesForSelect.set(CATALOGO_UNIDADES);
    this.form.reset({ codigo: '', nombre: '', descripcion: '', categoriaId: 0, unidadMedida: 'UND', stockMinimo: '0' });
  }

  startEdit(p: Producto): void {
    this.message.set(null);
    this.error.set(null);
    this.formMode.set('edit');
    this.editingId.set(p.id);
    const u = p.unidadMedida;
    if (CATALOGO_UNIDADES.some((o) => o.codigo === u)) {
      this.unidadesForSelect.set(CATALOGO_UNIDADES);
    } else {
      this.unidadesForSelect.set([{ codigo: u, nombre: 'Valor guardado' }, ...CATALOGO_UNIDADES]);
    }
    this.form.patchValue({
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      categoriaId: p.categoria.id,
      unidadMedida: p.unidadMedida,
      stockMinimo: String(p.stockMinimo)
    });
  }

  cancelForm(clearFeedback = false): void {
    this.formMode.set(null);
    this.editingId.set(null);
    this.unidadesForSelect.set(CATALOGO_UNIDADES);
    if (clearFeedback) {
      this.message.set(null);
      this.error.set(null);
    }
  }

  saveProducto(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: ProductoRequest = {
      codigo: v.codigo,
      nombre: v.nombre,
      descripcion: v.descripcion || undefined,
      categoriaId: v.categoriaId,
      unidadMedida: v.unidadMedida || undefined,
      stockMinimo: v.stockMinimo || undefined
    };
    this.saving.set(true);
    this.error.set(null);
    const id = this.editingId();
    const esAlta = this.formMode() === 'create';
    const req = esAlta ? this.productoApi.create(body) : this.productoApi.update(id!, body);
    req.subscribe({
      next: () => {
        this.error.set(null);
        this.message.set(
          esAlta
            ? 'Producto nuevo registrado en el catálogo. Ya puede usarlo en movimientos y existencias.'
            : 'Cambios guardados en el producto.'
        );
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.cancelForm();
        this.load();
      },
      error: (e) => {
        this.message.set(null);
        this.error.set(getApiErrorMessage(e));
      },
      complete: () => this.saving.set(false)
    });
  }

  toggleActivo(p: Producto): void {
    this.error.set(null);
    this.message.set(null);
    this.productoApi.setActivo(p.id, !p.activo).subscribe({
      next: () => {
        this.error.set(null);
        this.message.set('Estado actualizado.');
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.load();
      },
      error: (e) => {
        this.message.set(null);
        this.error.set(getApiErrorMessage(e));
      }
    });
  }
}
