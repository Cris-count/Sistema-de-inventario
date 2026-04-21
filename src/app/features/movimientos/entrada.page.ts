import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BodegaService } from '../../core/api/bodega.service';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { ProductoService } from '../../core/api/producto.service';
import { ProveedorService } from '../../core/api/proveedor.service';
import { AuthService } from '../../core/auth/auth.service';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-mov-entrada',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent, RouterLink],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <h1>Entrada de inventario</h1>
          <p class="page-lead">
            Registra ingreso de mercancía a una o más bodegas. Cada línea suma existencias del producto elegido en la bodega
            destino; revisa producto, destino y cantidad antes de confirmar.
          </p>
        </div>
        <div class="page-header__actions">
          <a routerLink="/app/dashboard" class="btn btn-text">Ir al panel</a>
          <a routerLink="/app/movimientos" class="btn btn-secondary">Historial de movimientos</a>
        </div>
      </header>

      <div class="page-body">
        <div class="card card--info stack stack--tight">
          <h2 class="ds-section-title" style="margin-bottom: 0.25rem">Flujo sugerido</h2>
          <ol class="ent-steps muted" style="margin: 0; padding-left: 1.25rem; max-width: 62ch">
            <li>Completa el encabezado (motivo y, si aplica, proveedor y referencia).</li>
            <li>Por cada línea: elige <strong>producto</strong> y <strong>bodega destino</strong>, luego la <strong>cantidad</strong>.</li>
            <li>Revisa el <strong>resumen</strong> al pie del formulario (visible cuando todo es válido) y pulsa <strong>Registrar entrada</strong>.</li>
          </ol>
        </div>

        @if (error()) {
          <div class="alert alert-error" role="alert">
            {{ error() }}
            <app-plan-block-followup [followup]="planFollowup()" />
          </div>
        } @else if (message()) {
          <div class="alert alert-success" role="status">{{ message() }}</div>
        }

        @if (lastRegistered(); as last) {
          <div class="card card--status stack stack--tight" role="status">
            <p class="card-eyebrow">Último movimiento registrado en esta sesión</p>
            <p class="ds-value" style="margin: 0">
              Entrada <span class="badge badge-info">#{{ last.id }}</span> — Puedes comprobarla en el historial.
            </p>
          </div>
        }

        @if (catalogLoading()) {
          <div class="card card--info">
            <div class="table-loading" style="padding: var(--space-ds-5)">
              <span class="spinner" aria-hidden="true"></span>
              Cargando productos, bodegas y datos del formulario…
            </div>
          </div>
        } @else {
          @if (productos().length === 0) {
            <div class="alert alert-warning" role="status">
              No hay productos disponibles en el catálogo (o no se pudieron cargar). Registra productos activos antes de
              registrar entradas.
            </div>
          }
          @if (bodegas().length === 0) {
            <div class="alert alert-warning" role="status">
              No hay bodegas disponibles. Crea al menos una bodega activa para indicar el destino del ingreso.
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" class="card card--action stack stack--tight">
            <div>
              <p class="card-eyebrow">Encabezado del movimiento</p>
              <h2 class="ds-section-title" style="margin-bottom: 0.35rem">Datos generales</h2>
              <p class="field-hint" style="margin: 0; max-width: 62ch">
                Identifican el contexto del ingreso. Las líneas de abajo detallan qué entra y a dónde.
              </p>
            </div>

            <fieldset class="form-section">
              <legend class="form-section__legend">Contexto y documento</legend>
              <div class="form-grid form-grid--2">
                <div class="field" [class.field--error]="form.controls.motivo.invalid && form.controls.motivo.touched">
                  <label for="ent-motivo">Motivo</label>
                  <input
                    id="ent-motivo"
                    formControlName="motivo"
                    type="text"
                    autocomplete="off"
                    placeholder="Ej. COMPRA, DEVOLUCIÓN, PRODUCCIÓN"
                  />
                  <p class="field-hint">Etiqueta operativa del ingreso; debe ser clara para auditoría.</p>
                  @if (form.controls.motivo.invalid && form.controls.motivo.touched) {
                    <p class="field-error">Indica el motivo del movimiento.</p>
                  }
                </div>
                @if (canPickProveedor()) {
                  <div class="field">
                    <label for="ent-prov">Proveedor (opcional)</label>
                    <select id="ent-prov" formControlName="proveedorId">
                      <option [ngValue]="null">— Sin proveedor —</option>
                      @for (pr of proveedores(); track pr.id) {
                        <option [ngValue]="pr.id">{{ pr.razonSocial }}</option>
                      }
                    </select>
                    <p class="field-hint">Vincula la entrada a un proveedor del catálogo cuando el ingreso es una compra.</p>
                  </div>
                } @else {
                  <div class="field">
                    <label for="ent-prov-raw">ID proveedor (opcional)</label>
                    <input id="ent-prov-raw" formControlName="proveedorIdRaw" type="number" min="1" step="1" placeholder="Solo si aplica" />
                    <p class="field-hint">Tu rol no puede listar proveedores; indica el identificador numérico si el backend lo exige.</p>
                  </div>
                }
                <div class="field">
                  <label for="ent-ref">Referencia de documento (opcional)</label>
                  <input id="ent-ref" formControlName="referenciaDocumento" type="text" autocomplete="off" placeholder="Factura, remisión, orden…" />
                </div>
                <div class="field form-grid__full">
                  <label for="ent-obs">Observación (opcional)</label>
                  <input id="ent-obs" formControlName="observacion" type="text" autocomplete="off" placeholder="Nota visible en el historial del movimiento" />
                </div>
              </div>
            </fieldset>

            <fieldset class="form-section">
              <legend class="form-section__legend">Líneas de entrada</legend>
              <p class="form-section__hint">
                Cada línea es un ingreso independiente: mismo encabezado, distinto producto o bodega. La cantidad aumenta el
                stock en la bodega destino.
              </p>

              <div class="field" style="max-width: 22rem">
                <label for="ent-filter-prod">Filtrar productos en los desplegables</label>
                <input
                  id="ent-filter-prod"
                  name="entFilterProd"
                  type="search"
                  [ngModel]="filtroProductosLista()"
                  (ngModelChange)="filtroProductosLista.set($event)"
                  autocomplete="off"
                  placeholder="Código o nombre…"
                  [disabled]="productos().length === 0"
                />
                <p class="field-hint">
                  Acorta la lista en <strong>todas</strong> las líneas. Si ya elegiste un ítem y deja de verse, borra el filtro.
                </p>
                @if (filtroProductosLista().trim() && productosFiltrados().length === 0) {
                  <p class="field-error" role="status">Ningún producto coincide. Ajusta o vacía el filtro.</p>
                }
              </div>

              <div class="stack stack--tight">
                @for (line of lines.controls; track $index; let i = $index) {
                  <div class="ent-line-block" [formGroup]="lineGroupAt(i)">
                    <div class="ent-line-head">
                      <span class="ent-line-num">Línea {{ i + 1 }}</span>
                      @if (lines.length > 1) {
                        <button type="button" class="btn btn-danger" (click)="removeLine(i)">Quitar línea</button>
                      }
                    </div>
                    <div class="form-grid form-grid--2">
                      <div
                        class="field"
                        [class.field--error]="
                          lineGroupAt(i).controls['productoId'].invalid && lineGroupAt(i).controls['productoId'].touched
                        "
                      >
                        <label [attr.for]="'ent-prod-' + i">Producto</label>
                        <select [id]="'ent-prod-' + i" formControlName="productoId">
                          <option [ngValue]="null">Seleccione producto…</option>
                          @for (p of productosFiltrados(); track p.id) {
                            <option [ngValue]="p.id">{{ p.codigo }} — {{ p.nombre }}</option>
                          }
                        </select>
                        @if (
                          lineGroupAt(i).controls['productoId'].invalid && lineGroupAt(i).controls['productoId'].touched
                        ) {
                          <p class="field-error">Selecciona un producto.</p>
                        }
                      </div>
                      <div
                        class="field"
                        [class.field--error]="
                          lineGroupAt(i).controls['bodegaDestinoId'].invalid &&
                          lineGroupAt(i).controls['bodegaDestinoId'].touched
                        "
                      >
                        <label [attr.for]="'ent-bod-' + i">Bodega destino</label>
                        <select [id]="'ent-bod-' + i" formControlName="bodegaDestinoId">
                          <option [ngValue]="null">Seleccione bodega…</option>
                          @for (b of bodegas(); track b.id) {
                            <option [ngValue]="b.id">{{ b.codigo }} — {{ b.nombre }}</option>
                          }
                        </select>
                        @if (
                          lineGroupAt(i).controls['bodegaDestinoId'].invalid &&
                          lineGroupAt(i).controls['bodegaDestinoId'].touched
                        ) {
                          <p class="field-error">Indica la bodega donde ingresa el stock.</p>
                        }
                      </div>
                      <div
                        class="field ent-cantidad-field"
                        [class.field--error]="
                          lineGroupAt(i).controls['cantidad'].invalid && lineGroupAt(i).controls['cantidad'].touched
                        "
                      >
                        <label [attr.for]="'ent-cant-' + i">Cantidad</label>
                        <input
                          [id]="'ent-cant-' + i"
                          formControlName="cantidad"
                          type="text"
                          inputmode="decimal"
                          autocomplete="off"
                          placeholder="Mayor que 0"
                        />
                        <p class="field-hint">Unidad según el producto (ej. UND, KG). Debe ser estrictamente mayor que cero.</p>
                        @if (lineGroupAt(i).controls['cantidad'].invalid && lineGroupAt(i).controls['cantidad'].touched) {
                          <p class="field-error">Indica la cantidad recibida.</p>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <button type="button" class="btn btn-secondary" (click)="addLine()">+ Agregar otra línea</button>
            </fieldset>

            @if (form.valid) {
              <div class="card card--info stack stack--tight" role="region" aria-label="Resumen del movimiento">
                <h3 class="ds-section-title" style="margin-bottom: 0.35rem">Resumen antes de registrar</h3>
                <p class="field-hint" style="margin: 0 0 var(--space-ds-3)">
                  Comprueba que producto, bodega y cantidades coinciden con el documento físico o la operación real.
                </p>
                <p class="ds-label" style="margin-bottom: var(--space-ds-1)">Motivo</p>
                <p class="ds-value" style="margin: 0 0 var(--space-ds-3)">{{ form.controls.motivo.value }}</p>
                <div class="table-wrap" style="box-shadow: none">
                  <table class="data">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Producto</th>
                        <th scope="col">Bodega destino</th>
                        <th scope="col" class="data-numeric">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (line of lines.controls; track $index; let i = $index) {
                        <tr>
                          <td>{{ i + 1 }}</td>
                          <td>{{ etiquetaProducto(lineGroupAt(i).getRawValue()['productoId']) }}</td>
                          <td>{{ etiquetaBodega(lineGroupAt(i).getRawValue()['bodegaDestinoId']) }}</td>
                          <td class="data-numeric">{{ lineGroupAt(i).getRawValue()['cantidad'] }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <div class="form-actions form-actions--start" style="border: none; padding-top: var(--space-ds-3)">
              <button
                type="submit"
                class="btn btn-primary"
                [class.is-loading]="saving()"
                [disabled]="saving() || catalogLoading() || productos().length === 0 || bodegas().length === 0 || form.invalid"
              >
                @if (saving()) {
                  <span class="spinner" aria-hidden="true"></span>
                  Registrando…
                } @else {
                  Registrar entrada
                }
              </button>
              <button type="button" class="btn btn-text" [disabled]="saving()" (click)="resetDraft()">Limpiar borrador</button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: `
    .ent-steps li {
      margin-bottom: var(--space-ds-2);
      line-height: 1.5;
    }
    .ent-steps li:last-child {
      margin-bottom: 0;
    }
    .ent-line-block {
      padding: var(--space-ds-4);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--bg-panel) 38%, var(--surface));
    }
    .ent-line-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-ds-3);
      margin-bottom: var(--space-ds-4);
    }
    .ent-line-num {
      font-size: var(--text-caption);
      font-weight: var(--font-weight-semibold);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .ent-cantidad-field label {
      font-weight: var(--font-weight-semibold);
    }
    @media (min-width: 720px) {
      .ent-cantidad-field {
        grid-column: 1 / -1;
        max-width: 16rem;
      }
    }
  `
})
export class MovEntradaPage implements OnInit {
  private readonly api = inject(MovimientoApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productoApi = inject(ProductoService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly proveedorApi = inject(ProveedorService);
  readonly auth = inject(AuthService);

  readonly productos = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly bodegas = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly proveedores = signal<{ id: number; razonSocial: string }[]>([]);
  readonly catalogLoading = signal(true);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  readonly lastRegistered = signal<{ id: number } | null>(null);
  /** Acorta las opciones de producto en todas las líneas (misma lista cargada del servidor). */
  readonly filtroProductosLista = signal('');

  readonly productosFiltrados = computed(() => {
    const q = this.filtroProductosLista().trim().toLowerCase();
    const all = this.productos();
    if (!q) {
      return all;
    }
    return all.filter(
      (p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
    );
  });

  private catalogLoadsPending = 0;

  canPickProveedor(): boolean {
    return this.auth.hasAnyRole(['ADMIN', 'SUPER_ADMIN', 'COMPRAS', 'GERENCIA']);
  }

  readonly form = this.fb.nonNullable.group({
    motivo: ['', Validators.required],
    proveedorId: null as number | null,
    proveedorIdRaw: null as number | null,
    referenciaDocumento: [''],
    observacion: [''],
    lineas: this.fb.array<FormGroup>([])
  });

  get lines(): FormArray {
    return this.form.controls.lineas;
  }

  ngOnInit(): void {
    const total = this.canPickProveedor() ? 3 : 2;
    this.catalogLoadsPending = total;
    this.catalogLoading.set(true);

    const done = (): void => {
      this.catalogLoadsPending--;
      if (this.catalogLoadsPending <= 0) {
        this.catalogLoading.set(false);
      }
    };

    this.bodegaApi.list().subscribe({
      next: (b) =>
        this.bodegas.set(
          b.filter((x) => x.activo !== false).map((x) => ({ id: x.id, codigo: x.codigo, nombre: x.nombre }))
        ),
      error: (e) => {
        this.bodegas.set([]);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
        done();
      },
      complete: done
    });

    this.productoApi.list(0, 500).subscribe({
      next: (p) =>
        this.productos.set(
          p.content.filter((x) => x.activo !== false).map((x) => ({ id: x.id, codigo: x.codigo, nombre: x.nombre }))
        ),
      error: () => {
        this.productos.set([]);
        done();
      },
      complete: done
    });

    if (this.canPickProveedor()) {
      this.proveedorApi.list().subscribe({
        next: (pr) => this.proveedores.set(pr.map((x) => ({ id: x.id, razonSocial: x.razonSocial }))),
        error: () => {
          this.proveedores.set([]);
          done();
        },
        complete: done
      });
    }

    this.addLine();
  }

  lineGroupAt(i: number): FormGroup {
    return this.lines.at(i) as FormGroup;
  }

  lineGroup(): FormGroup {
    return this.fb.nonNullable.group({
      productoId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      bodegaDestinoId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      cantidad: this.fb.nonNullable.control('', [Validators.required])
    });
  }

  addLine(): void {
    this.lines.push(this.lineGroup());
  }

  removeLine(i: number): void {
    this.lines.removeAt(i);
    if (this.lines.length === 0) {
      this.addLine();
    }
  }

  etiquetaProducto(id: number | null): string {
    if (id == null) {
      return '—';
    }
    const p = this.productos().find((x) => x.id === id);
    return p ? `${p.codigo} — ${p.nombre}` : `#${id}`;
  }

  etiquetaBodega(id: number | null): string {
    if (id == null) {
      return '—';
    }
    const b = this.bodegas().find((x) => x.id === id);
    return b ? `${b.codigo} — ${b.nombre}` : `#${id}`;
  }

  resetDraft(): void {
    this.message.set(null);
    this.error.set(null);
    this.planFollowup.set(null);
    this.lastRegistered.set(null);
    this.filtroProductosLista.set('');
    this.form.patchValue({
      motivo: '',
      proveedorId: null,
      proveedorIdRaw: null,
      referenciaDocumento: '',
      observacion: ''
    });
    this.lines.clear();
    this.addLine();
    this.form.markAsUntouched();
  }

  submit(): void {
    this.error.set(null);
    this.planFollowup.set(null);
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    type Linea = { productoId: number | null; bodegaDestinoId: number | null; cantidad: string };
    const lineas = (v.lineas as Linea[]).map((l) => ({
      productoId: l.productoId!,
      bodegaDestinoId: l.bodegaDestinoId!,
      cantidad: l.cantidad
    }));
    for (const l of lineas) {
      if (parseFloat(String(l.cantidad)) <= 0 || Number.isNaN(parseFloat(String(l.cantidad)))) {
        this.message.set(null);
        this.planFollowup.set(null);
        this.form.markAllAsTouched();
        for (const ctrl of this.lines.controls) {
          (ctrl as FormGroup).markAllAsTouched();
        }
        this.error.set('Cada cantidad debe ser un número mayor que cero.');
        return;
      }
    }
    let proveedorId = v.proveedorId;
    if (!this.canPickProveedor()) {
      proveedorId = v.proveedorIdRaw;
    }
    const body = {
      motivo: v.motivo,
      proveedorId: proveedorId ?? undefined,
      referenciaDocumento: v.referenciaDocumento || undefined,
      observacion: v.observacion || undefined,
      lineas
    };
    this.saving.set(true);
    this.api.entrada(body).subscribe({
      next: (m) => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.lastRegistered.set({ id: m.id });
        this.message.set(
          `Entrada #${m.id} registrada correctamente. El stock se actualizó en las bodegas indicadas.`
        );
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.lines.clear();
        this.addLine();
        this.form.patchValue({
          motivo: '',
          proveedorId: null,
          proveedorIdRaw: null,
          referenciaDocumento: '',
          observacion: ''
        });
        this.form.markAsUntouched();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.saving.set(false)
    });
  }
}
