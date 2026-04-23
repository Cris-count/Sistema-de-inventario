import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BodegaService } from '../../core/api/bodega.service';
import { ClienteApiService } from '../../core/api/cliente-api.service';
import { InventarioService } from '../../core/api/inventario.service';
import { ProductoService } from '../../core/api/producto.service';
import { UsuarioService } from '../../core/api/usuario.service';
import { VentaApiService } from '../../core/api/venta-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROLES_ADMIN, ROLES_VENTA_REGISTRO } from '../../core/auth/app-roles';
import {
  Bodega,
  ClienteListItem,
  Producto,
  UsuarioRow,
  VentaListItem,
  VentaOperativoResumen,
  VentaPanelResumen
} from '../../core/models/entities.model';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { flashSuccess } from '../../core/util/page-flash';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

interface DraftLine {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

@Component({
  selector: 'app-ventas',
  imports: [FormsModule, RouterLink, PlanBlockFollowupComponent, DecimalPipe, DatePipe],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <p class="card-eyebrow" style="margin: 0 0 0.35rem">Ventas</p>
          <h1>Panel de ventas</h1>
          <p class="page-lead">
            Registro transaccional: referencia visible (ej. <span class="badge">V-000123</span>), cliente opcional, una
            bodega por venta, descuento de stock y movimiento
            <span class="badge">SALIDA_POR_VENTA</span>.
          </p>
        </div>
      </header>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }

      @if (resumenLoading() && !resumen()) {
        <div class="card card--info" role="status" aria-busy="true">
          <p class="muted" style="margin: 0; display: flex; align-items: center; gap: 0.65rem">
            <span class="spinner" aria-hidden="true"></span>
            Cargando resumen…
          </p>
        </div>
      }

      @if (resumen(); as r) {
        <section class="kpi-grid" aria-label="Resumen de ventas">
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Ventas hoy</h2>
            <p class="stat">{{ r.ventasHoy | number }}</p>
            <p class="muted" style="margin: 0; font-size: 0.875rem">zona horaria Colombia</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Unidades vendidas hoy</h2>
            <p class="stat">{{ r.unidadesVendidasHoy | number }}</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Total vendido hoy</h2>
            <p class="stat">{{ r.totalVendidoHoy | number: '1.2-2' }}</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Ventas recientes</h2>
            <p class="stat">{{ r.ventasUltimos7Dias | number }}</p>
            <p class="muted" style="margin: 0; font-size: 0.875rem">últimos 7 días</p>
          </div>
        </section>
      }

      <section class="card stack" aria-labelledby="ventas-operativo-title">
        <h2 id="ventas-operativo-title" class="ds-section-title">Resumen operativo (período)</h2>
        <p class="field-hint muted ventas-operativo-hint" style="margin: 0">
          Métricas comerciales sobre ventas <strong>confirmadas</strong>; anuladas se muestran aparte. Zona horaria
          Colombia. {{ alcanceOperativoHint() }}
        </p>
        <div class="row ventas-operativo-fechas" style="flex-wrap: wrap; gap: var(--space-ds-4); align-items: flex-end">
          <div class="field" style="min-width: 9rem">
            <label for="op-desde">Desde</label>
            <input id="op-desde" type="date" [(ngModel)]="operativoDesde" name="operativoDesde" />
          </div>
          <div class="field" style="min-width: 9rem">
            <label for="op-hasta">Hasta</label>
            <input id="op-hasta" type="date" [(ngModel)]="operativoHasta" name="operativoHasta" />
          </div>
          <button type="button" class="btn btn-secondary" [disabled]="operativoLoading()" (click)="cargarOperativo()">
            @if (operativoLoading()) {
              <span class="spinner" aria-hidden="true"></span>
            }
            Actualizar resumen
          </button>
          <button type="button" class="btn btn-ghost" [disabled]="operativoLoading() || exportandoCsv()" (click)="descargarCsv()">
            @if (exportandoCsv()) {
              <span class="spinner" aria-hidden="true"></span>
            }
            Descargar CSV
          </button>
        </div>
        @if (operativo(); as op) {
          <div class="ventas-op-grid row" style="flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem">
            <div class="card kpi-card" style="min-width: 10rem; flex: 1">
              <h3 class="ds-section-title" style="font-size: 0.8rem; margin: 0">Confirmadas</h3>
              <p class="stat" style="font-size: 1.25rem">{{ op.ventasConfirmadas | number }}</p>
              <p class="muted" style="margin: 0; font-size: 0.8rem">ventas</p>
            </div>
            <div class="card kpi-card" style="min-width: 10rem; flex: 1">
              <h3 class="ds-section-title" style="font-size: 0.8rem; margin: 0">Total vendido</h3>
              <p class="stat" style="font-size: 1.25rem">{{ op.totalVendidoConfirmado | number: '1.2-2' }}</p>
            </div>
            <div class="card kpi-card" style="min-width: 10rem; flex: 1">
              <h3 class="ds-section-title" style="font-size: 0.8rem; margin: 0">Unidades</h3>
              <p class="stat" style="font-size: 1.25rem">{{ op.unidadesVendidasConfirmadas | number }}</p>
            </div>
            <div class="card kpi-card" style="min-width: 10rem; flex: 1">
              <h3 class="ds-section-title" style="font-size: 0.8rem; margin: 0">Anuladas</h3>
              <p class="stat" style="font-size: 1.25rem">{{ op.ventasAnuladas | number }}</p>
              <p class="muted" style="margin: 0; font-size: 0.75rem">
                Monto histórico {{ op.montoVentasAnuladasSnapshot | number: '1.2-2' }}
              </p>
            </div>
          </div>
          @if (op.topProductos.length > 0) {
            <h3 class="ds-section-title ventas-op-subtitle" style="font-size: 0.95rem; margin: 1rem 0 0.35rem">Top productos (unidades)</h3>
            <div class="table-wrap">
              <table class="data ventas-op-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th class="data-numeric">Cant.</th>
                    <th class="data-numeric">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of op.topProductos; track p.productoId) {
                    <tr>
                      <td>{{ p.codigo }}</td>
                      <td>{{ p.nombre }}</td>
                      <td class="data-numeric">{{ p.cantidadVendida | number }}</td>
                      <td class="data-numeric">{{ p.subtotalConfirmado | number: '1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (op.porVendedor.length > 0) {
            <h3 class="ds-section-title ventas-op-subtitle" style="font-size: 0.95rem; margin: 1rem 0 0.35rem">Por vendedor</h3>
            <div class="table-wrap">
              <table class="data ventas-op-table">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th class="data-numeric">Ventas</th>
                    <th class="data-numeric">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of op.porVendedor; track u.usuarioId) {
                    <tr>
                      <td>{{ u.usuarioEmail }}</td>
                      <td class="data-numeric">{{ u.ventasConfirmadas | number }}</td>
                      <td class="data-numeric">{{ u.totalMonto | number: '1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (op.porBodega.length > 0) {
            <h3 class="ds-section-title ventas-op-subtitle" style="font-size: 0.95rem; margin: 1rem 0 0.35rem">Por bodega</h3>
            <div class="table-wrap">
              <table class="data ventas-op-table">
                <thead>
                  <tr>
                    <th>Bodega</th>
                    <th class="data-numeric">Ventas</th>
                    <th class="data-numeric">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of op.porBodega; track b.bodegaId) {
                    <tr>
                      <td>{{ b.bodegaNombre }}</td>
                      <td class="data-numeric">{{ b.ventasConfirmadas | number }}</td>
                      <td class="data-numeric">{{ b.totalMonto | number: '1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </section>

      @if (canRegistrar()) {
        <section class="card stack" aria-labelledby="ventas-nueva-title">
          <h2 id="ventas-nueva-title" class="ds-section-title">Nueva venta</h2>
          <div class="row" style="flex-wrap: wrap; gap: var(--space-ds-4); align-items: flex-end">
            <div class="field" style="min-width: 14rem">
              <label for="v-bodega">Bodega</label>
              <select
                id="v-bodega"
                name="bodegaId"
                [(ngModel)]="bodegaId"
                (ngModelChange)="onBodegaChange()"
              >
                <option [ngValue]="null">Seleccionar…</option>
                @for (b of bodegas(); track b.id) {
                  <option [ngValue]="b.id">{{ b.codigo }} — {{ b.nombre }}</option>
                }
              </select>
            </div>
            <div class="field" style="min-width: 16rem">
              <label for="v-cliente">Cliente (opcional)</label>
              <select id="v-cliente" name="clienteId" [(ngModel)]="clienteId">
                <option [ngValue]="null">Sin cliente</option>
                @for (c of clientes(); track c.id) {
                  <option [ngValue]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </div>
            <div class="field field-flex-1" style="min-width: 12rem">
              <label for="v-obs">Observación (opcional)</label>
              <input id="v-obs" name="obs" [(ngModel)]="observacion" type="text" autocomplete="off" />
            </div>
          </div>
          <div class="row" style="flex-wrap: wrap; gap: var(--space-ds-4); align-items: flex-end">
            <button type="button" class="btn btn-secondary btn-sm" (click)="toggleNuevoCliente()">
              {{ mostrarNuevoCliente() ? 'Cerrar alta rápida' : '+ Nuevo cliente' }}
            </button>
          </div>
          @if (mostrarNuevoCliente()) {
            <div class="card card--info stack" style="padding: 1rem">
              <p class="muted" style="margin: 0; font-size: 0.875rem">
                Alta mínima para asociar a esta venta (no es un CRM completo).
              </p>
              <div class="row" style="flex-wrap: wrap; gap: var(--space-ds-4); align-items: flex-end">
                <div class="field" style="min-width: 12rem">
                  <label for="nc-nom">Nombre</label>
                  <input id="nc-nom" [(ngModel)]="nuevoClienteNombre" type="text" autocomplete="name" />
                </div>
                <div class="field" style="min-width: 10rem">
                  <label for="nc-doc">Documento</label>
                  <input id="nc-doc" [(ngModel)]="nuevoClienteDocumento" type="text" autocomplete="off" />
                  <p class="field-hint muted" style="margin: 0.25rem 0 0; font-size: 0.78rem; max-width: 28ch">
                    Si lo completás, debe ser único entre clientes activos (no diferencia mayúsculas).
                  </p>
                </div>
                <div class="field" style="min-width: 10rem">
                  <label for="nc-tel">Teléfono</label>
                  <input id="nc-tel" [(ngModel)]="nuevoClienteTelefono" type="text" autocomplete="tel" />
                </div>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  [disabled]="guardandoCliente()"
                  (click)="guardarNuevoCliente()"
                >
                  @if (guardandoCliente()) {
                    <span class="spinner" aria-hidden="true"></span>
                  }
                  Guardar y usar
                </button>
              </div>
            </div>
          }

          @if (bodegaId && stockCargando()) {
            <p class="muted stock-reload-hint" role="status" aria-live="polite">
              <span class="spinner" aria-hidden="true"></span>
              Actualizando stock de esta bodega…
            </p>
          }

          <div class="row" style="flex-wrap: wrap; gap: var(--space-ds-4); align-items: flex-end">
            <div class="field field-flex-1" style="min-width: 14rem">
              <label for="v-buscar">Buscar producto</label>
              <input
                id="v-buscar"
                type="search"
                name="busquedaProd"
                [ngModel]="busqueda()"
                (ngModelChange)="busqueda.set($event)"
                placeholder="Código o nombre"
                autocomplete="off"
              />
            </div>
            <div class="field field-flex-1" style="min-width: 14rem">
              <label for="v-producto">Producto a agregar</label>
              <select id="v-producto" name="pickProducto" [(ngModel)]="productoElegidoId">
                <option [ngValue]="null">—</option>
                @for (p of productosFiltrados(); track p.id) {
                  <option [ngValue]="p.id">
                    {{ p.codigo }} — {{ p.nombre }} (disp. {{ stockDisponible(p.id) | number }})
                  </option>
                }
              </select>
            </div>
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="!bodegaId || !productoElegidoId || stockCargando()"
              (click)="agregarLinea()"
            >
              Agregar al detalle
            </button>
          </div>

          @if (!bodegaId) {
            <p class="field-hint text-warning" style="margin: 0">Elegí una bodega para ver stock disponible y armar el detalle.</p>
          }

          @if (lineas().length === 0) {
            <p class="muted" style="margin: 0">Todavía no hay líneas en esta venta.</p>
          } @else {
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="data-numeric">Stock disp.</th>
                    <th class="data-numeric">Cantidad</th>
                    <th class="data-numeric">Precio unit.</th>
                    <th class="data-numeric">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of lineas(); track line.productoId) {
                    <tr [class.table-row-warn]="filaStockInvalida(line)">
                      <td>{{ line.codigo }} — {{ line.nombre }}</td>
                      <td class="data-numeric">{{ stockDisponible(line.productoId) | number }}</td>
                      <td class="data-numeric">
                        <input
                          type="number"
                          class="input-inline"
                          [ngModel]="line.cantidad"
                          (ngModelChange)="actualizarCantidad(line.productoId, $event)"
                          min="0.0001"
                          step="any"
                        />
                      </td>
                      <td class="data-numeric">
                        <input
                          type="number"
                          class="input-inline"
                          [ngModel]="line.precioUnitario"
                          (ngModelChange)="actualizarPrecio(line.productoId, $event)"
                          min="0"
                          step="any"
                        />
                      </td>
                      <td class="data-numeric">{{ subtotalLinea(line) | number: '1.2-2' }}</td>
                      <td>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="quitarLinea(line.productoId)">Quitar</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (puedePrecioCero()) {
              <p class="field-hint muted precio-cero-hint">
                <strong>Precio unitario:</strong> como administrador podés usar <strong>0</strong> (cortesía u operación
                sin importe). Para el resto de roles el precio debe ser mayor a 0.
              </p>
            } @else {
              <p class="field-hint text-warning precio-cero-hint">
                <strong>Precio unitario:</strong> para tu rol cada línea debe tener precio <strong>mayor a 0</strong>. El
                total en 0 no está permitido salvo perfil de administración.
              </p>
            }
            @if (stockBloqueante()) {
              <div class="alert alert-error" role="alert">
                Corregí las cantidades: no podés vender más unidades de las disponibles en esta bodega.
              </div>
            }
            <div class="row" style="justify-content: flex-end; align-items: baseline; gap: 1rem">
              <span class="muted">Total venta</span>
              <strong class="stat" style="font-size: 1.35rem">{{ totalVenta() | number: '1.2-2' }}</strong>
            </div>
            <button
              type="button"
              class="btn btn-primary"
              [disabled]="confirmando() || !bodegaId || lineas().length === 0 || stockBloqueante()"
              (click)="confirmar()"
            >
              @if (confirmando()) {
                <span class="spinner" aria-hidden="true"></span>
              }
              Confirmar venta
            </button>
          }
        </section>
      } @else {
        <p class="muted card card--info">
          Tu rol puede consultar ventas y totales. Solo perfiles de ventas o administración registran nuevas ventas.
        </p>
      }

      <section class="card stack">
        <div class="row" style="justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem">
          <h2 class="ds-section-title" style="margin: 0">Historial</h2>
          <div class="row" style="flex-wrap: wrap; gap: 0.5rem">
            <button type="button" class="btn btn-ghost btn-sm" (click)="limpiarFiltrosHistorial()">Limpiar filtros</button>
            <button type="button" class="btn btn-secondary" [disabled]="historialLoading()" (click)="cargarHistorial()">
              Aplicar / actualizar
            </button>
          </div>
        </div>
        <p class="field-hint historial-alcance" style="margin: 0">{{ historialAlcanceHint() }}</p>
        <div class="ventas-filtros row" style="flex-wrap: wrap; gap: var(--space-ds-4); align-items: flex-end">
          <div class="field" style="min-width: 9rem">
            <label for="fh-desde">Desde</label>
            <input id="fh-desde" type="date" [(ngModel)]="filtroFechaDesde" />
          </div>
          <div class="field" style="min-width: 9rem">
            <label for="fh-hasta">Hasta</label>
            <input id="fh-hasta" type="date" [(ngModel)]="filtroFechaHasta" />
          </div>
          <div class="field" style="min-width: 11rem">
            <label for="fh-bod">Bodega</label>
            <select id="fh-bod" [(ngModel)]="filtroBodegaId">
              <option [ngValue]="null">Todas</option>
              @for (b of bodegas(); track b.id) {
                <option [ngValue]="b.id">{{ b.codigo }}</option>
              }
            </select>
          </div>
          <div class="field" style="min-width: 10rem">
            <label for="fh-est">Estado</label>
            <select id="fh-est" [(ngModel)]="filtroEstado">
              <option value="">Todos</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <div class="field" style="min-width: 12rem">
            <label for="fh-cli">Cliente</label>
            <select id="fh-cli" [(ngModel)]="filtroClienteId">
              <option [ngValue]="null">Cualquiera</option>
              @for (c of clientes(); track c.id) {
                <option [ngValue]="c.id">{{ c.nombre }}</option>
              }
            </select>
          </div>
          @if (puedeFiltrarVendedor()) {
            <div class="field" style="min-width: 12rem">
              <label for="fh-usr">Vendedor</label>
              <select id="fh-usr" [(ngModel)]="filtroUsuarioId">
                <option [ngValue]="null">Todos</option>
                @for (u of usuariosFiltro(); track u.id) {
                  <option [ngValue]="u.id">{{ u.email }}</option>
                }
              </select>
            </div>
          }
          <div class="field field-flex-1" style="min-width: 8rem">
            <label for="fh-cod">Código venta</label>
            <input id="fh-cod" type="search" [(ngModel)]="filtroCodigo" placeholder="Ej. V-000001" autocomplete="off" />
          </div>
        </div>
        @if (historialLoading() && historial().length === 0) {
          <p class="muted" style="margin: 0">Cargando…</p>
        } @else if (historial().length === 0) {
          <p class="muted" style="margin: 0">
            {{ anyFiltroHistorial() ? historialVacioMensaje() : historialSinFiltrosMensaje() }}
          </p>
        } @else {
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Bodega</th>
                  <th>Cliente</th>
                  <th class="data-numeric">Total</th>
                  <th class="data-numeric">Ítems</th>
                  <th>Usuario</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (v of historial(); track v.id) {
                  <tr [class.table-row-muted]="v.estado === 'ANULADA'">
                    <td>
                      <strong>{{ v.codigoPublico }}</strong>
                      <span class="muted" style="font-size: 0.8rem">#{{ v.id }}</span>
                    </td>
                    <td>{{ v.fechaVenta | date: 'short' }}</td>
                    <td>
                      <span class="badge" [class.badge-warn]="v.estado === 'ANULADA'">{{ labelEstadoVenta(v.estado) }}</span>
                    </td>
                    <td>{{ v.bodegaNombre }}</td>
                    <td>{{ v.clienteNombre ?? '—' }}</td>
                    <td class="data-numeric">{{ v.total | number: '1.2-2' }}</td>
                    <td class="data-numeric">{{ v.cantidadLineas | number }}</td>
                    <td>{{ v.usuarioEmail }}</td>
                    <td>
                      <a [routerLink]="['/app', 'ventas', 'detalle', v.id]">Ver detalle</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .input-inline {
      width: 6.5rem;
      max-width: 100%;
    }
    .table-row-warn {
      background: color-mix(in srgb, var(--color-warning-soft, #fef3c7) 55%, transparent);
    }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    .stock-reload-hint {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .historial-alcance {
      font-size: 0.875rem;
      max-width: 72ch;
    }
    .precio-cero-hint {
      margin: 0;
      font-size: 0.875rem;
      max-width: 72ch;
    }
    .table-row-muted {
      opacity: 0.72;
    }
    .badge-warn {
      background: color-mix(in srgb, var(--color-warning-soft, #fef3c7) 70%, transparent);
      color: var(--color-text, inherit);
    }
    .ventas-operativo-hint {
      max-width: 72ch;
    }
    .ventas-op-table {
      font-size: 0.875rem;
    }
  `
})
export class VentasPage {
  private readonly ventaApi = inject(VentaApiService);
  private readonly productoApi = inject(ProductoService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly inventarioApi = inject(InventarioService);
  private readonly clienteApi = inject(ClienteApiService);
  private readonly usuarioApi = inject(UsuarioService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bodegas = signal<Bodega[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly clientes = signal<ClienteListItem[]>([]);
  readonly usuariosFiltro = signal<UsuarioRow[]>([]);
  readonly stockPorProducto = signal<Map<number, number>>(new Map());
  readonly busqueda = signal('');
  bodegaId: number | null = null;
  clienteId: number | null = null;
  observacion = '';
  productoElegidoId: number | null = null;

  readonly mostrarNuevoCliente = signal(false);
  nuevoClienteNombre = '';
  nuevoClienteDocumento = '';
  nuevoClienteTelefono = '';
  readonly guardandoCliente = signal(false);

  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroBodegaId: number | null = null;
  filtroEstado = '';
  filtroClienteId: number | null = null;
  filtroUsuarioId: number | null = null;
  filtroCodigo = '';

  operativoDesde = '';
  operativoHasta = '';
  readonly operativo = signal<VentaOperativoResumen | null>(null);
  readonly operativoLoading = signal(false);
  readonly exportandoCsv = signal(false);

  readonly lineas = signal<DraftLine[]>([]);
  /** Indica recarga de existencias tras elegir o cambiar de bodega (paginación GET /inventario). */
  readonly stockCargando = signal(false);
  readonly resumen = signal<VentaPanelResumen | null>(null);
  readonly resumenLoading = signal(false);
  readonly historial = signal<VentaListItem[]>([]);
  readonly historialLoading = signal(false);
  readonly confirmando = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly canRegistrar = computed(() => this.auth.hasAnyRole(ROLES_VENTA_REGISTRO));
  readonly puedePrecioCero = computed(() => this.auth.hasAnyRole(ROLES_ADMIN));
  readonly puedeFiltrarVendedor = computed(() => this.auth.hasAnyRole(ROLES_ADMIN));

  readonly alcanceOperativoHint = computed(() =>
    this.auth.hasAnyRole(['VENTAS'])
      ? 'Solo tus ventas entran en este resumen y en el CSV.'
      : 'Incluye las ventas de la empresa que tu rol puede ver.'
  );

  /** Alineado con el filtro del API: VENTAS solo ve sus ventas; el resto ve la empresa. */
  readonly historialAlcanceHint = computed(() =>
    this.auth.hasAnyRole(['VENTAS'])
      ? 'Listado de tus ventas (confirmadas y anuladas). Los KPIs superiores solo cuentan ventas confirmadas de hoy y últimos 7 días.'
      : 'Ventas de la empresa. Los KPIs superiores solo reflejan ventas confirmadas; el historial puede incluir anuladas según filtros.'
  );

  readonly historialVacioMensaje = computed(() =>
    this.auth.hasAnyRole(['VENTAS'])
      ? 'Todavía no registraste ventas con estos criterios.'
      : 'No hay ventas que coincidan con estos criterios.'
  );

  /**
   * Historial vacío sin filtros activos: copy según rol (GERENCIA y similares no deben ver CTA de registro).
   */
  readonly historialSinFiltrosMensaje = computed(() => {
    if (this.auth.hasAnyRole(['VENTAS'])) {
      return 'Todavía no registraste ventas.';
    }
    if (this.auth.hasAnyRole(['GERENCIA'])) {
      return 'No hay ventas registradas en la empresa en este listado.';
    }
    if (this.auth.hasAnyRole(ROLES_VENTA_REGISTRO)) {
      return 'No hay ventas registradas en la empresa. Podés registrar una en el bloque «Nueva venta».';
    }
    return 'No hay ventas registradas en la empresa en este listado.';
  });

  readonly productosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const all = this.productos().filter((p) => p.activo);
    if (!q) return all.slice(0, 80);
    return all
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
      .slice(0, 80);
  });

  readonly totalVenta = computed(() =>
    this.lineas().reduce((acc, l) => acc + this.subtotalLinea(l), 0)
  );

  readonly stockBloqueante = computed(() => this.lineas().some((l) => this.filaStockInvalida(l)));

  constructor() {
    this.bodegaApi.list().subscribe((b) => this.bodegas.set(b.filter((x) => x.activo)));
    this.productoApi.list(0, 1000).subscribe({
      next: (p) => this.productos.set(p.content),
      error: () => this.productos.set([])
    });
    this.cargarClientes();
    if (this.auth.hasAnyRole(ROLES_ADMIN)) {
      this.cargarUsuariosFiltro();
    }
    this.cargarResumen();
    this.cargarHistorial();
    const h = new Date();
    const d = new Date(h);
    d.setDate(d.getDate() - 6);
    this.operativoHasta = VentasPage.formatYmdLocal(h);
    this.operativoDesde = VentasPage.formatYmdLocal(d);
    this.cargarOperativo();
  }

  private static formatYmdLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  cargarOperativo(): void {
    this.operativoLoading.set(true);
    this.ventaApi
      .resumenOperativo(this.operativoDesde || undefined, this.operativoHasta || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.operativo.set(r);
          this.operativoLoading.set(false);
        },
        error: (e) => {
          this.operativoLoading.set(false);
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }

  descargarCsv(): void {
    this.exportandoCsv.set(true);
    this.error.set(null);
    this.ventaApi
      .exportCsv(this.operativoDesde || undefined, this.operativoHasta || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ventas_${this.operativoDesde}_${this.operativoHasta}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          this.exportandoCsv.set(false);
        },
        error: (e) => {
          this.exportandoCsv.set(false);
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }

  /** Solo presentación; el API sigue usando enums en mayúsculas. */
  labelEstadoVenta(estado: string): string {
    if (estado === 'CONFIRMADA') {
      return 'Confirmada';
    }
    if (estado === 'ANULADA') {
      return 'Anulada';
    }
    return estado;
  }

  cargarResumen(): void {
    this.resumenLoading.set(true);
    this.error.set(null);
    this.ventaApi
      .panelResumen()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.resumen.set(r);
          this.resumenLoading.set(false);
        },
        error: (e) => {
          this.resumenLoading.set(false);
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }

  cargarHistorial(): void {
    this.historialLoading.set(true);
    this.ventaApi
      .list(0, 15, this.buildFiltrosHistorial())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.historial.set(page.content);
          this.historialLoading.set(false);
        },
        error: (e) => {
          this.historialLoading.set(false);
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }

  anyFiltroHistorial(): boolean {
    return !!(
      this.filtroFechaDesde ||
      this.filtroFechaHasta ||
      this.filtroBodegaId != null ||
      this.filtroEstado ||
      this.filtroClienteId != null ||
      this.filtroUsuarioId != null ||
      (this.filtroCodigo && this.filtroCodigo.trim().length > 0)
    );
  }

  limpiarFiltrosHistorial(): void {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroBodegaId = null;
    this.filtroEstado = '';
    this.filtroClienteId = null;
    this.filtroUsuarioId = null;
    this.filtroCodigo = '';
    this.cargarHistorial();
  }

  private buildFiltrosHistorial(): {
    fechaDesde?: string;
    fechaHasta?: string;
    bodegaId?: number;
    usuarioVendedorId?: number;
    estado?: string;
    clienteId?: number;
    codigo?: string;
  } {
    const o: {
      fechaDesde?: string;
      fechaHasta?: string;
      bodegaId?: number;
      usuarioVendedorId?: number;
      estado?: string;
      clienteId?: number;
      codigo?: string;
    } = {};
    if (this.filtroFechaDesde) {
      o.fechaDesde = this.filtroFechaDesde;
    }
    if (this.filtroFechaHasta) {
      o.fechaHasta = this.filtroFechaHasta;
    }
    if (this.filtroBodegaId != null) {
      o.bodegaId = this.filtroBodegaId;
    }
    if (this.filtroEstado) {
      o.estado = this.filtroEstado;
    }
    if (this.filtroClienteId != null) {
      o.clienteId = this.filtroClienteId;
    }
    if (this.puedeFiltrarVendedor() && this.filtroUsuarioId != null) {
      o.usuarioVendedorId = this.filtroUsuarioId;
    }
    const cod = this.filtroCodigo?.trim();
    if (cod) {
      o.codigo = cod;
    }
    return o;
  }

  private cargarClientes(): void {
    this.clienteApi
      .list(0, 500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.clientes.set(p.content.filter((c) => c.activo)),
        error: () => this.clientes.set([])
      });
  }

  private cargarUsuariosFiltro(): void {
    const acc: UsuarioRow[] = [];
    const load = (page: number): void => {
      this.usuarioApi
        .list(page, 100)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (pg) => {
            for (const u of pg.content) {
              if (u.activo) {
                acc.push(u);
              }
            }
            if (pg.number + 1 < pg.totalPages) {
              load(page + 1);
            } else {
              this.usuariosFiltro.set(acc.sort((a, b) => a.email.localeCompare(b.email)));
            }
          },
          error: () => this.usuariosFiltro.set(acc)
        });
    };
    load(0);
  }

  toggleNuevoCliente(): void {
    this.mostrarNuevoCliente.update((v) => !v);
    if (!this.mostrarNuevoCliente()) {
      this.nuevoClienteNombre = '';
      this.nuevoClienteDocumento = '';
      this.nuevoClienteTelefono = '';
    }
  }

  guardarNuevoCliente(): void {
    const nom = this.nuevoClienteNombre.trim();
    if (!nom) {
      this.error.set('El nombre del cliente es obligatorio.');
      return;
    }
    this.guardandoCliente.set(true);
    this.error.set(null);
    this.clienteApi
      .create({
        nombre: nom,
        documento: this.nuevoClienteDocumento.trim() || undefined,
        telefono: this.nuevoClienteTelefono.trim() || undefined
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => {
          this.clientes.update((list) => [...list, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          this.clienteId = c.id;
          this.mostrarNuevoCliente.set(false);
          this.nuevoClienteNombre = '';
          this.nuevoClienteDocumento = '';
          this.nuevoClienteTelefono = '';
          this.guardandoCliente.set(false);
          this.message.set(`Cliente "${c.nombre}" creado y seleccionado.`);
          flashSuccess(this.destroyRef, () => this.message.set(null));
        },
        error: (e) => {
          this.guardandoCliente.set(false);
          this.error.set(getApiErrorMessage(e));
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }

  onBodegaChange(): void {
    this.lineas.set([]);
    this.productoElegidoId = null;
    this.recargarStockBodega();
  }

  recargarStockBodega(): void {
    const bid = this.bodegaId;
    if (bid == null) {
      this.stockCargando.set(false);
      this.stockPorProducto.set(new Map());
      return;
    }
    this.stockCargando.set(true);
    const acc = new Map<number, number>();
    const loadPage = (page: number): void => {
      this.inventarioApi.list(page, 500, { bodegaId: bid }).subscribe({
        next: (p) => {
          for (const row of p.content) {
            const pid = row.producto.id;
            const q = parseFloat(String(row.cantidad));
            acc.set(pid, (acc.get(pid) ?? 0) + (Number.isFinite(q) ? q : 0));
          }
          if (p.number + 1 < p.totalPages) {
            loadPage(page + 1);
          } else {
            this.stockPorProducto.set(acc);
            this.stockCargando.set(false);
          }
        },
        error: () => {
          this.stockPorProducto.set(acc);
          this.stockCargando.set(false);
        }
      });
    };
    loadPage(0);
  }

  stockDisponible(productoId: number): number {
    return this.stockPorProducto().get(productoId) ?? 0;
  }

  agregarLinea(): void {
    const bid = this.bodegaId;
    const pid = this.productoElegidoId;
    if (bid == null || pid == null || this.stockCargando()) return;
    if (this.lineas().some((l) => l.productoId === pid)) {
      this.error.set('Este producto ya está en el detalle.');
      this.planFollowup.set(null);
      return;
    }
    const p = this.productos().find((x) => x.id === pid);
    if (!p) return;
    this.error.set(null);
    const disp = this.stockDisponible(pid);
    if (disp <= 0) {
      this.error.set('No hay stock disponible en la bodega seleccionada para este producto.');
      return;
    }
    this.lineas.update((lines) => [
      ...lines,
      {
        productoId: pid,
        codigo: p.codigo,
        nombre: p.nombre,
        cantidad: 1,
        precioUnitario: 0
      }
    ]);
    this.productoElegidoId = null;
  }

  quitarLinea(productoId: number): void {
    this.lineas.update((lines) => lines.filter((l) => l.productoId !== productoId));
  }

  actualizarCantidad(productoId: number, raw: number | string): void {
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    this.lineas.update((lines) =>
      lines.map((l) => (l.productoId === productoId ? { ...l, cantidad: Number.isFinite(n) ? n : l.cantidad } : l))
    );
  }

  actualizarPrecio(productoId: number, raw: number | string): void {
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    this.lineas.update((lines) =>
      lines.map((l) => (l.productoId === productoId ? { ...l, precioUnitario: Number.isFinite(n) ? n : l.precioUnitario } : l))
    );
  }

  subtotalLinea(line: DraftLine): number {
    return line.cantidad * line.precioUnitario;
  }

  filaStockInvalida(line: DraftLine): boolean {
    return line.cantidad > this.stockDisponible(line.productoId) + 1e-9;
  }

  confirmar(): void {
    const bid = this.bodegaId;
    if (bid == null || this.lineas().length === 0 || this.stockBloqueante()) return;
    for (const l of this.lineas()) {
      if (!(l.cantidad > 0) || l.precioUnitario < 0 || !Number.isFinite(l.cantidad) || !Number.isFinite(l.precioUnitario)) {
        this.error.set('Revisá cantidades (> 0) y precios (≥ 0) en todas las líneas.');
        return;
      }
    }
    if (!this.puedePrecioCero() && this.lineas().some((l) => l.precioUnitario <= 0)) {
      this.error.set('Cada línea debe tener precio unitario mayor a 0. Si necesitás cortesías a precio 0, un administrador debe registrar la venta.');
      return;
    }
    this.confirmando.set(true);
    this.error.set(null);
    this.message.set(null);
    this.planFollowup.set(null);
    const obs = this.observacion.trim() || undefined;
    this.ventaApi
      .crear({
        bodegaId: bid,
        clienteId: this.clienteId ?? undefined,
        observacion: obs,
        lineas: this.lineas().map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario
        }))
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (v) => {
          this.message.set(
            `Venta ${v.codigoPublico} confirmada (id ${v.id}). Movimiento inventario #${v.movimientoId}.`
          );
          flashSuccess(this.destroyRef, () => this.message.set(null));
          this.lineas.set([]);
          this.observacion = '';
          this.clienteId = null;
          this.recargarStockBodega();
          this.cargarResumen();
          this.cargarHistorial();
        },
        error: (e) => {
          this.message.set(null);
          this.error.set(getApiErrorMessage(e));
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        },
        complete: () => this.confirmando.set(false)
      });
  }
}
