import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BodegaService } from '../../core/api/bodega.service';
import { CategoriaService } from '../../core/api/categoria.service';
import { InventarioService } from '../../core/api/inventario.service';
import { ProductoService, ProductoRequest } from '../../core/api/producto.service';
import { ProveedorService } from '../../core/api/proveedor.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROLES_GESTION_PRODUCTOS } from '../../core/auth/app-roles';
import { Bodega, Producto, Proveedor } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
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
const DECIMAL_PATTERN = /^(?:\d+|\d*[.,]\d{1,4})$/;

function parseNonNegativeDecimal(raw: unknown): number | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const txt = String(raw).trim().replace(',', '.');
  if (!txt || !DECIMAL_PATTERN.test(txt)) return null;
  const num = Number(txt);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function initialStockOptionalValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const qty = parseNonNegativeDecimal(group.get('initialCantidad')?.value);
    const bodegaRaw = group.get('initialBodegaId')?.value;
    if (qty !== null && qty > 0 && (bodegaRaw === null || bodegaRaw === undefined || bodegaRaw === '')) {
      return { initialBodegaRequired: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-productos',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent, RouterLink, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <h1>Productos</h1>
          <app-dismissible-hint hintId="productos.pageIntro" persist="local" variant="flush">
            <p class="page-lead">
              Catálogo para movimientos y existencias: busca por código o nombre, revisa estado y mantén límites de reposición
              al día.
            </p>
          </app-dismissible-hint>
        </div>
        @if (canGestionarProductos()) {
          <div class="page-header__actions">
            <button type="button" class="btn btn-primary" (click)="startCreate()">Nuevo producto</button>
          </div>
        }
      </header>

      <div class="page-body">
        @if (canGestionarProductos()) {
          <app-dismissible-hint hintId="productos.notaMercanciaNueva" persist="local">
            <div class="alert alert-info" role="note">
              <strong>Mercancía nueva:</strong> si recibes ítems cuyo código aún no está en el catálogo, regístralos aquí antes
              de cargar existencias o registrar movimientos.
            </div>
          </app-dismissible-hint>
        }
        @if (esSoloLecturaProductos()) {
          <app-dismissible-hint hintId="productos.notaSoloConsulta" persist="local">
            <div class="alert alert-info" role="note">
              <strong>Solo consulta:</strong> tu rol (<strong>{{ auth.role() }}</strong>) puede ver el catálogo. Alta, edición y
              activación las realizan <strong>Administración</strong> o <strong>Auxiliar de bodega</strong>, según política del
              servidor.
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

        @if (formMode()) {
          <section id="formulario-producto" class="card card--action stack stack--tight">
            <div>
              <p class="card-eyebrow">{{ formMode() === 'create' ? 'Alta' : 'Edición' }}</p>
              <h2 class="ds-section-title" style="margin-bottom: 0.35rem">
                {{ formMode() === 'create' ? 'Registrar producto nuevo' : 'Editar producto' }}
              </h2>
              @if (formMode() === 'create') {
                <p class="field-hint" style="margin: 0; max-width: 62ch">
                  Al guardar quedará disponible para entradas, salidas, transferencias y consulta de existencias.
                </p>
              } @else {
                <p class="field-hint" style="margin: 0; max-width: 62ch">
                  Los cambios aplican al catálogo inmediatamente tras guardar.
                </p>
              }
            </div>

            <form [formGroup]="form" (ngSubmit)="saveProducto()" class="form-stack form-stack--tight">
              <fieldset class="form-section">
                <legend class="form-section__legend">Identificación</legend>
                <p class="form-section__hint">Código y nombre tal como los verás en movimientos y reportes.</p>
                <div class="form-grid form-grid--2">
                  <div class="field" [class.field--error]="form.controls.codigo.invalid && form.controls.codigo.touched">
                    <label for="prod-codigo">Código</label>
                    <input id="prod-codigo" formControlName="codigo" type="text" autocomplete="off" placeholder="Ej. SKU-001" />
                    @if (form.controls.codigo.invalid && form.controls.codigo.touched) {
                      <p class="field-error">El código es obligatorio.</p>
                    }
                  </div>
                  <div class="field" [class.field--error]="form.controls.nombre.invalid && form.controls.nombre.touched">
                    <label for="prod-nombre">Nombre</label>
                    <input id="prod-nombre" formControlName="nombre" type="text" autocomplete="off" placeholder="Nombre visible" />
                    @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
                      <p class="field-error">El nombre es obligatorio.</p>
                    }
                  </div>
                </div>
              </fieldset>

              <fieldset class="form-section">
                <legend class="form-section__legend">Detalle</legend>
                <div class="form-grid">
                  <div class="field form-grid__full">
                    <label for="prod-desc">Descripción (opcional)</label>
                    <textarea id="prod-desc" formControlName="descripcion" rows="2" placeholder="Notas internas o especificación breve"></textarea>
                  </div>
                </div>
              </fieldset>

              <fieldset class="form-section">
                <legend class="form-section__legend">Clasificación e inventario</legend>
                <div class="form-grid form-grid--2">
                  <div class="field" [class.field--error]="form.controls.categoriaId.invalid && form.controls.categoriaId.touched">
                    <label for="prod-cat">Categoría</label>
                    <select id="prod-cat" formControlName="categoriaId">
                      <option [ngValue]="0">Seleccione…</option>
                      @for (c of categorias(); track c.id) {
                        <option [ngValue]="c.id">{{ c.nombre }}</option>
                      }
                    </select>
                    @if (form.controls.categoriaId.invalid && form.controls.categoriaId.touched) {
                      <p class="field-error">Selecciona una categoría.</p>
                    }
                  </div>
                  <div class="field">
                    <label for="prod-um">Unidad de medida</label>
                    <select id="prod-um" formControlName="unidadMedida">
                      @for (o of unidadesForSelect(); track o.codigo) {
                        <option [value]="o.codigo">{{ o.codigo }} — {{ o.nombre }}</option>
                      }
                    </select>
                    <p class="field-hint">Unidad en la que se controla stock y movimientos.</p>
                  </div>
                  <div class="field">
                    <label for="prod-min">Stock mínimo</label>
                    <input id="prod-min" formControlName="stockMinimo" type="text" inputmode="decimal" placeholder="0" />
                    <p class="field-hint">Umbral para alertas de reposición (decimal según tu operación).</p>
                  </div>
                  <div class="field form-grid__full">
                    <label for="prod-prov">Proveedor preferido (reposición)</label>
                    <select id="prod-prov" formControlName="proveedorPreferidoId">
                      <option [ngValue]="null">— Ninguno —</option>
                      @for (pr of proveedores(); track pr.id) {
                        <option [ngValue]="pr.id">{{ pr.razonSocial }}</option>
                      }
                    </select>
                    <p class="field-hint">
                      Las alertas por stock mínimo pueden notificar al correo configurado en <strong>Proveedores</strong> para
                      este proveedor.
                    </p>
                  </div>
                  <div class="field form-grid__full">
                    <app-dismissible-hint hintId="productos.ayudaStockVsMinimo" persist="local">
                      <div class="card card--info stack stack--tight" style="margin: 0; padding: var(--space-ds-3)">
                        <p class="field-hint" style="margin: 0; max-width: 72ch">
                          <strong>Cantidad en bodega frente al mínimo:</strong> este formulario es el maestro del producto y solo
                          guarda el <em>mínimo</em> para alertas. La cantidad que <em>llega</em> o la que <em>hay disponible</em> se
                          registra por bodega con una
                          <a [routerLink]="['/app/movimientos/entrada']">entrada de mercancía</a>
                          (o con
                          <a [routerLink]="['/app/stock-inicial']">stock inicial</a>
                          si corresponde al arranque). El detalle por bodega está en
                          <a [routerLink]="['/app/inventario']">Inventario</a>.
                        </p>
                      </div>
                    </app-dismissible-hint>
                    @if (formMode() === 'edit') {
                      <div
                        class="card card--info stack stack--tight"
                        style="margin: var(--space-ds-3) 0 0; padding: var(--space-ds-3)"
                      >
                        @if (stockResumenLoading()) {
                          <p class="field-hint" style="margin: 0">Cargando existencias por bodega…</p>
                        } @else if (stockResumenError()) {
                          <p class="field-hint" style="margin: 0">
                            No se pudieron cargar las existencias. Revisá permisos o abrí la pantalla Inventario.
                          </p>
                        } @else if (stockResumenByBodega().length === 0) {
                          <p class="field-hint" style="margin: 0">
                            <strong>Sin saldo en bodegas:</strong> aún no hay cantidad registrada para este producto. Usá una
                            entrada para sumar unidades.
                          </p>
                        } @else {
                          <p class="field-hint" style="margin: 0">
                            <strong>Total en bodegas:</strong> {{ stockResumenTotalLabel() }}
                            <span class="muted"> (suma de todas las líneas con este producto)</span>
                          </p>
                          <ul
                            class="muted-list"
                            style="margin: 0.35rem 0 0; padding-left: 1.25rem; font-size: var(--text-body-sm)"
                          >
                            @for (line of stockResumenByBodega(); track line.bodegaId) {
                              <li>{{ line.bodegaNombre }}: <strong>{{ line.cantidad }}</strong></li>
                            }
                          </ul>
                        }
                      </div>
                    }
                  </div>
                </div>
              </fieldset>

              @if (formMode() === 'create') {
                <fieldset class="form-section">
                  <legend class="form-section__legend">Stock inicial (opcional)</legend>
                  <p class="form-section__hint">
                    Si indicas una cantidad mayor que cero, el sistema registrará un movimiento de inventario real (stock inicial)
                    en la bodega elegida, con la misma trazabilidad que en «Inventario». Si dejas la cantidad en 0, solo se crea el
                    producto en el catálogo.
                  </p>
                  <div class="form-grid form-grid--2">
                    <div
                      class="field"
                      [class.field--error]="
                        (form.controls.initialBodegaId.invalid && form.controls.initialBodegaId.touched) ||
                        (form.hasError('initialBodegaRequired') && form.touched)
                      "
                    >
                      <label for="prod-stock-ini-bodega">Bodega inicial</label>
                      <select id="prod-stock-ini-bodega" formControlName="initialBodegaId">
                        <option [ngValue]="null">— Sin carga de existencias —</option>
                        @for (b of bodegas(); track b.id) {
                          <option [ngValue]="b.id">{{ b.nombre }}</option>
                        }
                      </select>
                      <p class="field-hint">Obligatoria solo si la cantidad inicial es mayor que 0.</p>
                      @if (form.hasError('initialBodegaRequired') && form.touched) {
                        <p class="field-error">Elige bodega para registrar el stock inicial.</p>
                      }
                    </div>
                    <div
                      class="field"
                      [class.field--error]="form.controls.initialCantidad.invalid && form.controls.initialCantidad.touched"
                    >
                      <label for="prod-stock-ini-qty">Cantidad inicial</label>
                      <input
                        id="prod-stock-ini-qty"
                        formControlName="initialCantidad"
                        type="text"
                        inputmode="decimal"
                        placeholder="0"
                      />
                      <p class="field-hint">Decimal no negativo; 0 = sin movimiento de inventario.</p>
                      @if (form.controls.initialCantidad.invalid && form.controls.initialCantidad.touched) {
                        <p class="field-error">Usa un número válido mayor o igual a 0.</p>
                      }
                    </div>
                  </div>
                </fieldset>
              }

              <fieldset class="form-section">
                <legend class="form-section__legend">Precios y rentabilidad</legend>
                <div class="form-grid form-grid--2">
                  <div class="field" [class.field--error]="form.controls.purchaseCost.invalid && form.controls.purchaseCost.touched">
                    <label for="prod-cost">Costo del producto</label>
                    <input id="prod-cost" formControlName="purchaseCost" type="text" inputmode="decimal" placeholder="0.00" />
                    <p class="field-hint">Valor al que ingresa el producto al negocio.</p>
                    @if (form.controls.purchaseCost.invalid && form.controls.purchaseCost.touched) {
                      <p class="field-error">Ingresa un costo válido mayor o igual a 0.</p>
                    }
                  </div>
                  <div class="field" [class.field--error]="form.controls.salePrice.invalid && form.controls.salePrice.touched">
                    <label for="prod-price">Precio de venta</label>
                    <input id="prod-price" formControlName="salePrice" type="text" inputmode="decimal" placeholder="0.00" />
                    <p class="field-hint">Valor sugerido o actual al que se vende el producto.</p>
                    @if (form.controls.salePrice.invalid && form.controls.salePrice.touched) {
                      <p class="field-error">Ingresa un precio de venta válido mayor o igual a 0.</p>
                    }
                  </div>
                </div>
                @if (pricingReady()) {
                  <p class="field-hint" style="margin: 0">
                    Utilidad estimada: <strong>{{ estimatedProfit() }}</strong>
                    @if (marginPercent() !== null) {
                      · Margen: <strong>{{ marginPercent() }}%</strong>
                    }
                  </p>
                } @else {
                  <p class="field-hint" style="margin: 0">
                    Completa costo y precio para ver utilidad estimada y margen.
                  </p>
                }
              </fieldset>

              <div class="form-actions form-actions--start" style="margin-top: 0">
                <button type="submit" class="btn btn-primary" [class.is-loading]="saving()" [disabled]="saving() || form.invalid">
                  @if (saving()) {
                    <span class="spinner" aria-hidden="true"></span>
                    Guardando…
                  } @else {
                    {{ formMode() === 'create' ? 'Guardar producto' : 'Guardar cambios' }}
                  }
                </button>
                <button type="button" class="btn btn-text" [disabled]="saving()" (click)="cancelForm(true)">Cancelar</button>
              </div>
            </form>
          </section>
        }

        <section class="stack stack--tight" aria-labelledby="productos-listado-title">
          <div class="table-toolbar">
            <h2 id="productos-listado-title" class="ds-section-title" style="margin: 0; flex: 1 1 100%; width: 100%">
              Listado
            </h2>
            <div class="table-toolbar__search">
              <div class="field">
                <label for="prod-buscar">Buscar</label>
                <input
                  id="prod-buscar"
                  name="prodBuscar"
                  type="search"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  autocomplete="off"
                  placeholder="Código, nombre o categoría…"
                  [disabled]="loading() || rows().length === 0"
                />
                <p class="field-hint">
                  Filtra los resultados <strong>de la página actual</strong>. Para ver más ítems usa la paginación.
                </p>
              </div>
            </div>
            <div class="table-toolbar__filters">
              <div class="field">
                <label for="prod-filtro-estado">Estado</label>
                <select
                  id="prod-filtro-estado"
                  name="prodEstado"
                  [ngModel]="estadoFiltro()"
                  (ngModelChange)="onEstadoFiltro($event)"
                  [disabled]="loading() || rows().length === 0"
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Solo activos</option>
                  <option value="inactivos">Solo inactivos</option>
                </select>
              </div>
            </div>
          </div>

          @if (!loading() && rows().length > 0 && (searchQuery().trim() || estadoFiltro() !== 'todos')) {
            <p class="muted" style="margin: 0">
              Mostrando <strong>{{ displayRows().length }}</strong> de <strong>{{ rows().length }}</strong> en esta página.
            </p>
          }

          <div class="table-wrap" [attr.aria-busy]="loading()">
            @if (loading()) {
              <div class="table-loading">
                <span class="spinner" aria-hidden="true"></span>
                Cargando productos…
              </div>
            } @else if (rows().length === 0) {
              <div class="table-empty" role="status">
                <p class="table-empty__title">Aún no hay productos en esta página</p>
                <p class="table-empty__hint">
                  Si acabas de empezar, crea el primer ítem con <strong>Nuevo producto</strong>. Si esperabas ver datos, revisa la
                  paginación o los permisos de tu rol.
                </p>
              </div>
            } @else if (displayRows().length === 0) {
              <div class="table-empty" role="status">
                <p class="table-empty__title">Nada coincide con el filtro</p>
                <p class="table-empty__hint">
                  Prueba otra búsqueda, cambia el filtro de estado o avanza de página: el criterio solo aplica a los registros
                  cargados aquí.
                </p>
              </div>
            } @else {
              <table class="data table-zebra">
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Und.</th>
                    <th scope="col" class="data-numeric">Mín.</th>
                    <th scope="col">Estado</th>
                    @if (canGestionarProductos()) {
                      <th scope="col" class="data-actions"><span class="visually-hidden">Acciones</span></th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (p of displayRows(); track p.id) {
                    <tr>
                      <td>
                        <span class="prod-codigo">{{ p.codigo }}</span>
                      </td>
                      <td>{{ p.nombre }}</td>
                      <td>
                        <span class="table-cell-muted">{{ p.categoria.nombre }}</span>
                      </td>
                      <td>
                        <abbr [attr.title]="unidadNombre(p.unidadMedida)">{{ p.unidadMedida }}</abbr>
                      </td>
                      <td class="data-numeric">{{ p.stockMinimo }}</td>
                      <td>
                        <span class="badge" [class.badge-active]="p.activo" [class.badge-inactive]="!p.activo">{{
                          p.activo ? 'Activo' : 'Inactivo'
                        }}</span>
                      </td>
                      @if (canGestionarProductos()) {
                        <td class="data-actions">
                          <div class="table-actions">
                            <button type="button" class="btn btn-text" (click)="startEdit(p)">Editar</button>
                            <button type="button" class="btn btn-text" (click)="toggleActivo(p)">
                              {{ p.activo ? 'Desactivar' : 'Activar' }}
                            </button>
                          </div>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          @if (!loading() && rows().length > 0) {
            <div class="pager">
              <button type="button" class="btn btn-secondary" [disabled]="page() <= 0 || loading()" (click)="prev()">
                Anterior
              </button>
              <span class="pager-meta"
                >Página {{ page() + 1 }} de {{ totalPages() }} · {{ pageSize }} por página</span
              >
              <button type="button" class="btn btn-secondary" [disabled]="!hasNext() || loading()" (click)="next()">
                Siguiente
              </button>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: `
    .prod-codigo {
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.03em;
      font-size: var(--text-body-sm);
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
export class ProductosPage implements OnInit {
  private readonly productoApi = inject(ProductoService);
  private readonly proveedorApi = inject(ProveedorService);
  private readonly categoriaApi = inject(CategoriaService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly inventarioApi = inject(InventarioService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  readonly pageSize = 20;

  /** ADMIN y auxiliar de bodega pueden dar de alta/editar productos (mercancía nueva). */
  readonly canGestionarProductos = () => this.auth.hasAnyRole(ROLES_GESTION_PRODUCTOS);

  /** COMPRAS y GERENCIA: listado permitido; escritura no (alineado con @PreAuthorize en API). */
  readonly esSoloLecturaProductos = () =>
    this.auth.hasAnyRole(['COMPRAS', 'GERENCIA']) && !this.auth.hasAnyRole(ROLES_GESTION_PRODUCTOS);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly rows = signal<Producto[]>([]);
  readonly categorias = signal<{ id: number; nombre: string }[]>([]);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly bodegas = signal<Bodega[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly formMode = signal<'create' | 'edit' | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly searchQuery = signal('');
  readonly estadoFiltro = signal<'todos' | 'activos' | 'inactivos'>('todos');

  readonly stockResumenLoading = signal(false);
  readonly stockResumenError = signal(false);
  readonly stockResumenTotalLabel = signal<string | null>(null);
  readonly stockResumenByBodega = signal<{ bodegaId: number; bodegaNombre: string; cantidad: string }[]>([]);

  readonly displayRows = computed(() => {
    let list = this.rows();
    const q = this.searchQuery().trim().toLowerCase();
    const est = this.estadoFiltro();
    if (est === 'activos') {
      list = list.filter((p) => p.activo);
    } else if (est === 'inactivos') {
      list = list.filter((p) => !p.activo);
    }
    if (q) {
      list = list.filter((p) => {
        const cat = p.categoria?.nombre?.toLowerCase() ?? '';
        return (
          p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q) || cat.includes(q)
        );
      });
    }
    return list;
  });

  readonly unidadesForSelect = signal(CATALOGO_UNIDADES);

  readonly form = this.fb.nonNullable.group(
    {
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      categoriaId: [0, [Validators.required, Validators.min(1)]],
      unidadMedida: ['UND'],
      stockMinimo: ['0'],
      purchaseCost: ['0', [Validators.required, Validators.pattern(DECIMAL_PATTERN)]],
      salePrice: ['0', [Validators.required, Validators.pattern(DECIMAL_PATTERN)]],
      proveedorPreferidoId: null as number | null,
      initialBodegaId: null as number | null,
      initialCantidad: ['0', [Validators.pattern(DECIMAL_PATTERN)]]
    },
    { validators: [initialStockOptionalValidator()] }
  );

  ngOnInit(): void {
    this.categoriaApi.list().subscribe((c) => this.categorias.set(c));
    this.proveedorApi.list().subscribe({
      next: (list) => this.proveedores.set(list),
      error: () => this.proveedores.set([])
    });
    this.bodegaApi.list().subscribe({
      next: (list) => this.bodegas.set(list),
      error: () => this.bodegas.set([])
    });
    this.load();
  }

  unidadNombre(codigo: string): string {
    const hit = CATALOGO_UNIDADES.find((u) => u.codigo === codigo);
    return hit ? `${hit.nombre} (${hit.codigo})` : codigo;
  }

  onEstadoFiltro(v: string): void {
    if (v === 'activos' || v === 'inactivos' || v === 'todos') {
      this.estadoFiltro.set(v);
    }
  }

  hasNext(): boolean {
    return this.page() + 1 < this.totalPages();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    this.productoApi.list(this.page(), this.pageSize).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(p.totalPages);
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

  private scrollFormIntoView(): void {
    queueMicrotask(() =>
      globalThis.document.getElementById('formulario-producto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }

  startCreate(): void {
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
    this.resetStockResumen();
    this.formMode.set('create');
    this.editingId.set(null);
    this.unidadesForSelect.set(CATALOGO_UNIDADES);
    this.form.reset({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoriaId: 0,
      unidadMedida: 'UND',
      stockMinimo: '0',
      purchaseCost: '0',
      salePrice: '0',
      proveedorPreferidoId: null,
      initialBodegaId: null,
      initialCantidad: '0'
    });
    this.scrollFormIntoView();
  }

  startEdit(p: Producto): void {
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
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
      stockMinimo: String(p.stockMinimo),
      purchaseCost: String(p.purchaseCost ?? 0),
      salePrice: String(p.salePrice ?? 0),
      proveedorPreferidoId: p.proveedorPreferidoId ?? null,
      initialBodegaId: null,
      initialCantidad: '0'
    });
    this.loadStockResumen(p.id);
    this.scrollFormIntoView();
  }

  cancelForm(clearFeedback = false): void {
    this.resetStockResumen();
    this.formMode.set(null);
    this.editingId.set(null);
    this.unidadesForSelect.set(CATALOGO_UNIDADES);
    if (clearFeedback) {
      this.message.set(null);
      this.error.set(null);
      this.planFollowup.set(null);
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
      stockMinimo: v.stockMinimo || undefined,
      purchaseCost: this.decimalFromInput(v.purchaseCost) ?? 0,
      salePrice: this.decimalFromInput(v.salePrice) ?? 0,
      proveedorPreferidoId: v.proveedorPreferidoId ?? null
    };
    const esAlta = this.formMode() === 'create';
    let initialQtyAlta = 0;
    if (esAlta) {
      const iq = this.decimalFromInput(v.initialCantidad) ?? 0;
      initialQtyAlta = iq;
      body.initialCantidad = iq;
      if (iq > 0) {
        body.initialBodegaId = v.initialBodegaId ?? undefined;
      }
    }
    this.saving.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    const id = this.editingId();
    const req = esAlta ? this.productoApi.create(body) : this.productoApi.update(id!, body);
    req.subscribe({
      next: () => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set(
          esAlta
            ? initialQtyAlta > 0
              ? 'Producto registrado y stock inicial cargado con movimiento trazable en la bodega indicada.'
              : 'Producto nuevo registrado en el catálogo. Ya puede usarlo en movimientos y existencias.'
            : 'Cambios guardados en el producto.'
        );
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.cancelForm();
        this.load();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.saving.set(false)
    });
  }

  toggleActivo(p: Producto): void {
    this.error.set(null);
    this.planFollowup.set(null);
    this.message.set(null);
    this.productoApi.setActivo(p.id, !p.activo).subscribe({
      next: () => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set('Estado actualizado.');
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.load();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      }
    });
  }

  pricingReady(): boolean {
    return this.decimalFromInput(this.form.controls.purchaseCost.value) !== null
      && this.decimalFromInput(this.form.controls.salePrice.value) !== null;
  }

  estimatedProfit(): string {
    const purchase = this.decimalFromInput(this.form.controls.purchaseCost.value);
    const sale = this.decimalFromInput(this.form.controls.salePrice.value);
    if (purchase === null || sale === null) return '—';
    return this.formatMoney(sale - purchase);
  }

  marginPercent(): string | null {
    const purchase = this.decimalFromInput(this.form.controls.purchaseCost.value);
    const sale = this.decimalFromInput(this.form.controls.salePrice.value);
    if (purchase === null || sale === null || sale <= 0) return null;
    return ((sale - purchase) / sale * 100).toFixed(2);
  }

  private decimalFromInput(raw: unknown): number | null {
    return parseNonNegativeDecimal(raw);
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private resetStockResumen(): void {
    this.stockResumenLoading.set(false);
    this.stockResumenError.set(false);
    this.stockResumenTotalLabel.set(null);
    this.stockResumenByBodega.set([]);
  }

  private loadStockResumen(productoId: number): void {
    this.stockResumenError.set(false);
    this.stockResumenTotalLabel.set(null);
    this.stockResumenByBodega.set([]);
    this.stockResumenLoading.set(true);
    this.inventarioApi.list(0, 500, { productoId }).subscribe({
      next: (page) => {
        const rows = page.content;
        let sum = 0;
        const lines: { bodegaId: number; bodegaNombre: string; cantidad: string }[] = [];
        for (const r of rows) {
          const q = Number(String(r.cantidad).replace(',', '.'));
          if (Number.isFinite(q)) {
            sum += q;
          }
          lines.push({
            bodegaId: r.bodegaId,
            bodegaNombre: r.bodegaNombre ?? 'Bodega',
            cantidad: String(r.cantidad)
          });
        }
        lines.sort((a, b) => a.bodegaNombre.localeCompare(b.bodegaNombre, 'es'));
        this.stockResumenByBodega.set(lines);
        this.stockResumenTotalLabel.set(this.formatQty(sum));
        this.stockResumenLoading.set(false);
      },
      error: () => {
        this.stockResumenLoading.set(false);
        this.stockResumenError.set(true);
      }
    });
  }

  private formatQty(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    }).format(value);
  }
}
