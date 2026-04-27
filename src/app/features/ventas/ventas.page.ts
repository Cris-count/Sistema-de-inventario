import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { ROLE_CODE_VENTAS } from '../../core/navigation';
import { flashSuccess } from '../../core/util/page-flash';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { VentaPosCartLineComponent } from './venta-pos-cart-line.component';
import { VentaPosProductTileComponent } from './venta-pos-product-tile.component';

interface DraftLine {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

type PosStockFilter = 'todos' | 'disponibles' | 'agotados';

@Component({
  selector: 'app-ventas',
  imports: [
    FormsModule,
    RouterLink,
    PlanBlockFollowupComponent,
    DecimalPipe,
    DatePipe,
    DismissibleHintComponent,
    VentaPosCartLineComponent,
    VentaPosProductTileComponent,
    NgTemplateOutlet
  ],
  template: `
    <div class="page stack" [class.ventas-page--pos]="esModoPos()">
      <header class="page-header page-header--split ventas-page-header">
        <div class="page-header__intro">
          @if (esModoPos()) {
            <p class="card-eyebrow" style="margin: 0 0 0.35rem">Punto de venta</p>
            <h1>Nueva venta</h1>
            <app-dismissible-hint hintId="ventas.posIntro" persist="local" variant="flush">
              <p class="page-lead">
                Buscá, agregá al carrito y cobrá con tarjeta. El stock se valida contra la bodega seleccionada y se
                descuenta solo cuando el servidor confirma el cobro.
              </p>
            </app-dismissible-hint>
          } @else {
            <p class="card-eyebrow" style="margin: 0 0 0.35rem">Ventas</p>
            <h1>Panel de ventas</h1>
            <app-dismissible-hint hintId="ventas.pageIntro" persist="local" variant="flush">
              <p class="page-lead">
                Registro transaccional: referencia visible (ej. <span class="badge">V-000123</span>), cliente opcional, una
                bodega por venta, descuento de stock y movimiento
                <span class="badge">SALIDA_POR_VENTA</span>.
              </p>
            </app-dismissible-hint>
          }
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
        @if (esModoPos()) {
          <section class="ventas-pos-kpi-strip" aria-label="Resumen rápido de ventas">
            <div class="ventas-pos-kpi-chip">
              <span class="ventas-pos-kpi-label">Hoy</span>
              <strong>{{ r.ventasHoy | number }}</strong>
              <span class="muted">ventas</span>
            </div>
            <div class="ventas-pos-kpi-chip">
              <span class="ventas-pos-kpi-label">Unid.</span>
              <strong>{{ r.unidadesVendidasHoy | number }}</strong>
            </div>
            <div class="ventas-pos-kpi-chip">
              <span class="ventas-pos-kpi-label">Total hoy</span>
              <strong>{{ r.totalVendidoHoy | number: '1.2-2' }}</strong>
            </div>
            <div class="ventas-pos-kpi-chip">
              <span class="ventas-pos-kpi-label">7 días</span>
              <strong>{{ r.ventasUltimos7Dias | number }}</strong>
              <span class="muted">ventas</span>
            </div>
          </section>
        } @else {
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
      }

      <ng-template #tplOperativo>
        <app-dismissible-hint hintId="ventas.resumenOperativoAyuda" persist="local">
          <p class="field-hint muted ventas-operativo-hint" style="margin: 0">
            Métricas comerciales sobre ventas <strong>confirmadas</strong>; anuladas se muestran aparte. Zona horaria
            Colombia. El CSV incluye interpretación operativa y aclaración de pago para no confundir anulación con
            reembolso. {{ alcanceOperativoHint() }}
          </p>
        </app-dismissible-hint>
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
              <h3 class="ds-section-title" style="font-size: 0.8rem; margin: 0">Anuladas operativas</h3>
              <p class="stat" style="font-size: 1.25rem">{{ op.ventasAnuladas | number }}</p>
              <p class="muted" style="margin: 0; font-size: 0.75rem">
                Stock revertido · monto histórico {{ op.montoVentasAnuladasSnapshot | number: '1.2-2' }}
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
      </ng-template>

      @if (!esModoPos()) {
        <section class="card stack" aria-labelledby="ventas-operativo-title">
          <h2 id="ventas-operativo-title" class="ds-section-title">Resumen operativo (período)</h2>
          <ng-container *ngTemplateOutlet="tplOperativo" />
        </section>
      }

      @if (canRegistrar() && esModoPos()) {
        <section class="ventas-pos-workspace card" aria-labelledby="ventas-pos-title">
          <h2 id="ventas-pos-title" class="ds-section-title ventas-pos-sr-title">Carrito</h2>
          <div class="ventas-pos-station-bar">
            <div>
              <p class="card-eyebrow">Estación POS</p>
              <h2 class="ventas-pos-station-title">Venta en curso</h2>
            </div>
            <div class="ventas-pos-station-metrics" aria-label="Estado de venta actual">
              <span><strong>{{ lineas().length | number }}</strong> líneas</span>
              <span><strong>{{ unidadesCarrito() | number }}</strong> unid.</span>
              <span><strong>{{ totalVenta() | number: '1.2-2' }}</strong> total</span>
            </div>
          </div>
          <div class="ventas-pos-grid">
            <div class="ventas-pos-catalog stack">
              <div class="ventas-pos-catalog-head">
                <div>
                  <p class="card-eyebrow">Catálogo</p>
                  <h3 class="ventas-pos-section-title">Productos</h3>
                </div>
              </div>
              <div class="ventas-pos-catalog-tools">
                <div class="field ventas-pos-search">
                  <label for="pos-buscar">Buscar producto</label>
                  <input
                    id="pos-buscar"
                    type="search"
                    [ngModel]="busqueda()"
                    (ngModelChange)="busqueda.set($event)"
                    placeholder="Escaneá código o buscá por nombre"
                    autocomplete="off"
                  />
                </div>
                <div class="ventas-pos-filter-chips" role="group" aria-label="Filtro de disponibilidad">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [class.is-active]="filtroStock() === 'todos'"
                    (click)="filtroStock.set('todos')"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [class.is-active]="filtroStock() === 'disponibles'"
                    [disabled]="!bodegaId || stockCargando()"
                    (click)="filtroStock.set('disponibles')"
                  >
                    Disponibles
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [class.is-active]="filtroStock() === 'agotados'"
                    [disabled]="!bodegaId || stockCargando()"
                    (click)="filtroStock.set('agotados')"
                  >
                    Agotados
                  </button>
                </div>
              </div>
              <div class="ventas-pos-stock-context">
                <span class="ventas-pos-stock-context-label">Vendiendo desde</span>
                <strong>{{ bodegaSeleccionadaLabel() }}</strong>
              </div>
              @if (!bodegaId) {
                <p class="field-hint text-warning ventas-pos-bodega-warning">
                  Elegí la bodega en el panel derecho para ver stock y precios.
                </p>
              }
              @if (stockError()) {
                <div class="alert alert-error" role="alert">
                  {{ stockError() }}
                </div>
              }
              @if (bodegaId && stockCargando()) {
                <p class="muted stock-reload-hint" role="status">
                  <span class="spinner" aria-hidden="true"></span>
                  Actualizando stock…
                </p>
              }
              <div class="ventas-pos-product-list" role="list">
                @if (bodegaId && !stockCargando() && productosFiltrados().length === 0) {
                  <p class="muted ventas-pos-catalog-empty" role="status">
                    No hay productos que coincidan con la búsqueda. Probá otro término o borrá el filtro.
                  </p>
                }
                @for (p of productosFiltrados(); track p.id) {
                  <app-venta-pos-product-tile
                    [nombre]="p.nombre"
                    [codigo]="p.codigo"
                    [stock]="stockDisponible(p.id)"
                    [availabilityState]="availabilityState(p.id)"
                    [availabilityLabel]="availabilityLabel(p.id)"
                    [quantityInCart]="cantidadEnCarrito(p.id)"
                    [price]="precioListaProducto(p)"
                    [disabled]="!productoDisponible(p.id)"
                    [actionDisabled]="pagandoStripe() || !bodegaId || stockCargando() || cantidadMaximaProducto(p.id) < 1"
                    [actionTitle]="addButtonTitle(p.id)"
                    [outOfStockVisible]="!!bodegaId && !stockCargando() && stockDisponible(p.id) <= 0"
                    [maxQuantity]="cantidadMaximaProducto(p.id)"
                    (add)="agregarProductoRapido(p)"
                  />
                }
              </div>
            </div>
            <aside class="ventas-pos-cart stack" [class.ventas-pos-cart--ready]="listoParaCobrar()" aria-label="Detalle de la venta">
              <div class="ventas-pos-cart-head">
                <div>
                  <p class="card-eyebrow">Carrito POS</p>
                  <h3 class="ds-section-title ventas-pos-cart-heading">Venta actual</h3>
                </div>
                <span class="ventas-pos-cart-count">{{ lineas().length | number }} líneas · {{ unidadesCarrito() | number }} unid.</span>
              </div>
              <div class="ventas-pos-sale-fields">
                <div class="field">
                  <label for="pos-bodega">Bodega</label>
                  <select
                    id="pos-bodega"
                    [(ngModel)]="bodegaId"
                    (ngModelChange)="onBodegaChange()"
                    [disabled]="pagandoStripe()"
                  >
                    <option [ngValue]="null">Seleccionar…</option>
                    @for (b of bodegas(); track b.id) {
                      <option [ngValue]="b.id">{{ b.codigo }} — {{ b.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label for="pos-cliente">Cliente (opcional)</label>
                  <select id="pos-cliente" [(ngModel)]="clienteId" [disabled]="pagandoStripe()">
                    <option [ngValue]="null">Sin cliente</option>
                    @for (c of clientes(); track c.id) {
                      <option [ngValue]="c.id">{{ c.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="field ventas-pos-note-field">
                  <label for="pos-obs">Nota en la venta (opcional)</label>
                  <input
                    id="pos-obs"
                    [(ngModel)]="observacion"
                    type="text"
                    autocomplete="off"
                    placeholder="Ej. pedido especial"
                    [disabled]="pagandoStripe()"
                  />
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" (click)="toggleNuevoCliente()">
                {{ mostrarNuevoCliente() ? 'Cerrar alta rápida' : '+ Nuevo cliente' }}
              </button>
              @if (mostrarNuevoCliente()) {
                <div class="card card--info stack ventas-pos-new-client-card">
                  <div class="row ventas-pos-new-client-row">
                    <div class="field ventas-pos-new-client-field--name">
                      <label for="pos-nc-nom">Nombre</label>
                      <input id="pos-nc-nom" [(ngModel)]="nuevoClienteNombre" type="text" autocomplete="name" />
                    </div>
                    <div class="field ventas-pos-new-client-field">
                      <label for="pos-nc-doc">Documento</label>
                      <input id="pos-nc-doc" [(ngModel)]="nuevoClienteDocumento" type="text" autocomplete="off" />
                    </div>
                    <div class="field ventas-pos-new-client-field">
                      <label for="pos-nc-tel">Teléfono</label>
                      <input id="pos-nc-tel" [(ngModel)]="nuevoClienteTelefono" type="text" autocomplete="tel" />
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
              @if (lineas().length === 0) {
                <div class="ventas-pos-cart-empty">
                  <strong>Listo para armar la venta</strong>
                  <p class="muted ventas-pos-empty-copy">
                    @if (!bodegaId) {
                      Elegí una <strong>bodega</strong> para cargar stock y empezar a vender.
                    } @else if (stockError()) {
                      Revisá la carga de stock antes de agregar productos.
                    } @else {
                      Agregá productos disponibles para iniciar el cobro.
                    }
                  </p>
                </div>
              } @else {
                <div class="ventas-pos-cart-summary">
                  <span><strong>{{ lineas().length | number }}</strong> líneas</span>
                  <span><strong>{{ unidadesCarrito() | number }}</strong> unidades</span>
                  <span>Desde {{ bodegaSeleccionadaLabel() }}</span>
                </div>
                <ul class="ventas-pos-lines">
                  @for (line of lineas(); track line.productoId) {
                    <li
                      app-venta-pos-cart-line
                      [line]="line"
                      [paying]="pagandoStripe()"
                      [stockLoading]="stockCargando()"
                      [stockInvalid]="filaStockInvalida(line)"
                      [maxQuantity]="cantidadMaximaProducto(line.productoId)"
                      [maxTitle]="cantidadMaximaTitle(line)"
                      [stockAvailable]="stockDisponible(line.productoId)"
                      [warehouseLabel]="bodegaSeleccionadaLabel()"
                      (remove)="quitarLinea(line.productoId)"
                      (decrement)="disminuirCantidad(line.productoId)"
                      (increment)="incrementarCantidad(line.productoId)"
                      (priceChange)="actualizarPrecio(line.productoId, $event)"
                    ></li>
                  }
                </ul>
                @if (stockBloqueante()) {
                  <div class="alert alert-error" role="alert">
                    Cantidades por encima del stock en esta bodega.
                  </div>
                }
                <div class="ventas-pos-checkout-zone" [class.ventas-pos-checkout-zone--ready]="listoParaCobrar()">
                  <div class="ventas-pos-checkout-head">
                    <span class="ventas-pos-checkout-label">Cierre de venta</span>
                    @if (listoParaCobrar()) {
                      <span class="ventas-pos-ready-pill">Listo</span>
                    }
                  </div>
                  <div class="ventas-pos-total-row">
                    <span>Total a cobrar</span>
                    <strong class="ventas-pos-total">{{ totalVenta() | number: '1.2-2' }}</strong>
                  </div>
                  @if (listoParaCobrar()) {
                    <p class="field-hint ventas-pos-ready-hint">
                      Stock validado. Checkout listo.
                    </p>
                  }
                  @if (!listoParaCobrar()) {
                    <p class="field-hint text-warning precio-cero-hint">
                      Revisá precio, stock y total antes de cobrar.
                    </p>
                  }
                  <button
                    type="button"
                    class="btn btn-primary ventas-pos-confirm"
                    [disabled]="
                      pagandoStripe() || !bodegaId || lineas().length === 0 || stockBloqueante() || totalVenta() <= 0
                    "
                    [attr.aria-busy]="pagandoStripe()"
                    (click)="irAPagarConStripe()"
                  >
                    @if (pagandoStripe()) {
                      <span class="spinner" aria-hidden="true"></span>
                      Abriendo cobro…
                    } @else {
                      Cobrar con tarjeta
                    }
                  </button>
                </div>
                @if (puedePrecioCero() && totalVenta() <= 0 && lineas().length > 0) {
                  <p class="field-hint muted ventas-pos-admin-zero-hint">
                    Como administrador podés registrar una venta a precio 0 sin pasar por Stripe desde el panel clásico de
                    ventas (no POS).
                  </p>
                }
              }
            </aside>
          </div>
        </section>
      }

      @if (esModoPos()) {
        <section class="card stack ventas-pos-analytics-card" aria-label="Análisis secundario de ventas">
          <details class="ventas-pos-details">
            <summary class="ventas-pos-details-summary">Período, CSV y análisis</summary>
            <ng-container *ngTemplateOutlet="tplOperativo" />
          </details>
        </section>
      }

      @if (canRegistrar() && !esModoPos()) {
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
              <app-dismissible-hint hintId="ventas.altaRapidaClienteNota" persist="session">
                <p class="muted" style="margin: 0; font-size: 0.875rem">
                  Alta mínima para asociar a esta venta (no es un CRM completo).
                </p>
              </app-dismissible-hint>
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
      }

      @if (!canRegistrar()) {
        <app-dismissible-hint hintId="ventas.rolSoloConsultaVentas" persist="local">
          <p class="muted card card--info">
            Tu rol puede consultar ventas y totales. Solo perfiles de ventas o administración registran nuevas ventas.
          </p>
        </app-dismissible-hint>
      }

      <section class="card stack ventas-history-card">
        <details class="ventas-history-details">
          <summary class="ventas-history-summary">
            <div class="ventas-history-head">
              <div>
                <p class="card-eyebrow">Revisión</p>
                <h2 class="ds-section-title ventas-history-title">Historial de ventas</h2>
              </div>
              <div class="ventas-history-actions">
                <span class="ventas-history-count">{{ historial().length | number }} visibles</span>
              </div>
            </div>
          </summary>
        <app-dismissible-hint hintId="ventas.historialAlcanceAyuda" persist="local">
          <p class="field-hint historial-alcance">{{ historialAlcanceHint() }}</p>
        </app-dismissible-hint>
        <div class="ventas-history-actions ventas-history-actions--toolbar">
          <button type="button" class="btn btn-ghost btn-sm ventas-history-clear" (click)="limpiarFiltrosHistorial()">Limpiar filtros</button>
          <button type="button" class="btn btn-secondary ventas-history-apply" [disabled]="historialLoading()" (click)="cargarHistorial()">
            Actualizar historial
          </button>
        </div>
        <div class="ventas-filtros ventas-history-filters">
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
              <option value="ANULACION_SOLICITADA">Anulación solicitada</option>
              <option value="ANULADA">Anulada (stock revertido)</option>
              <option value="PENDIENTE_PAGO">Pendiente de pago</option>
              <option value="CANCELADA_SIN_PAGO">Cancelada sin pago</option>
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
          <p class="muted ventas-history-empty">Cargando historial…</p>
        } @else if (historial().length === 0) {
          <p class="muted ventas-history-empty">
            {{ anyFiltroHistorial() ? historialVacioMensaje() : historialSinFiltrosMensaje() }}
          </p>
        } @else {
          <div class="table-wrap ventas-history-table-wrap">
            <table class="data ventas-history-table">
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
                  <tr
                    [class.table-row-muted]="
                      v.estado === 'ANULADA' || v.estado === 'CANCELADA_SIN_PAGO' || v.estado === 'PENDIENTE_PAGO'
                        || v.estado === 'ANULACION_SOLICITADA'
                    "
                  >
                    <td>
                      <strong class="ventas-history-code">{{ v.codigoPublico }}</strong>
                      <span class="muted ventas-history-id">#{{ v.id }}</span>
                    </td>
                    <td class="ventas-history-date">{{ v.fechaVenta | date: 'short' }}</td>
                    <td class="ventas-history-status-cell">
                      <span [class]="estadoVentaBadgeClass(v.estado)">{{ labelEstadoVenta(v.estado) }}</span>
                      @if (v.estado === 'ANULADA' && v.pagoEstado === 'STRIPE_SUCCEEDED') {
                        <div class="table-cell-muted">Pago Stripe no marcado como reembolsado</div>
                      }
                    </td>
                    <td>{{ v.bodegaNombre }}</td>
                    <td>{{ v.clienteNombre ?? '—' }}</td>
                    <td class="data-numeric ventas-history-total">{{ v.total | number: '1.2-2' }}</td>
                    <td class="data-numeric">{{ v.cantidadLineas | number }}</td>
                    <td>{{ v.usuarioEmail }}</td>
                    <td class="ventas-history-row-actions">
                      <a class="ventas-history-detail-link" [routerLink]="['/app', 'ventas', 'detalle', v.id]">Detalle</a>
                      @if (v.estado === 'CONFIRMADA') {
                        <a class="ventas-history-receipt-link" [routerLink]="['/app', 'ventas', 'recibo', v.id]">Comprobante</a>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        </details>
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
      margin: 0;
      font-size: 0.875rem;
      max-width: 72ch;
    }
    .precio-cero-hint {
      margin: 0;
      font-size: 0.875rem;
      max-width: 72ch;
    }
    .table-row-muted {
      opacity: 0.78;
    }
    .ventas-pos-kpi-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin: -0.2rem 0 0.35rem;
      opacity: 0.86;
    }
    .ventas-pos-kpi-chip {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.2rem 0.4rem;
      padding: 0.35rem 0.6rem;
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 82%, transparent);
      border: 1px solid var(--border-subtle);
      font-size: 0.78rem;
    }
    .ventas-pos-kpi-label {
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      width: 100%;
    }
    .ventas-pos-details-summary {
      cursor: pointer;
      font-weight: 600;
      padding: 0.25rem 0;
    }
    .ventas-pos-workspace {
      padding: 1rem;
      border-color: color-mix(in srgb, var(--border) 82%, var(--color-primary, var(--accent)));
      background:
        radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary-soft, var(--accent-soft)) 55%, transparent), transparent 34rem),
        color-mix(in srgb, var(--surface) 88%, var(--bg-panel));
    }
    .ventas-pos-station-bar {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 0.85rem;
      padding: 0.75rem 0.85rem;
      border: 1px solid color-mix(in srgb, var(--border-subtle) 78%, var(--color-primary, var(--accent)));
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 78%, transparent);
    }
    .ventas-pos-station-title {
      margin: 0;
      font-size: clamp(1.15rem, 2vw, 1.45rem);
      letter-spacing: -0.035em;
    }
    .ventas-pos-station-metrics {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.45rem;
      min-width: min(21rem, 100%);
    }
    .ventas-pos-station-metrics span {
      padding: 0.38rem 0.55rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--bg-panel) 58%, transparent);
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 700;
    }
    .ventas-pos-sr-title {
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
    .ventas-pos-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(24rem, 28rem);
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .ventas-pos-grid {
        grid-template-columns: 1fr;
      }
      .ventas-pos-station-bar,
      .ventas-pos-catalog-tools {
        grid-template-columns: 1fr;
      }
      .ventas-pos-station-bar {
        flex-direction: column;
      }
      .ventas-pos-station-metrics,
      .ventas-pos-filter-chips {
        justify-content: flex-start;
      }
    }
    .ventas-pos-catalog-head {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .ventas-pos-catalog-tools {
      display: grid;
      grid-template-columns: minmax(14rem, 1fr) auto;
      gap: 0.65rem;
      align-items: end;
      padding: 0.65rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
    }
    .ventas-pos-search input {
      font-size: 1rem;
      min-height: 2.65rem;
      border-color: color-mix(in srgb, var(--border) 72%, var(--color-primary, var(--accent)));
      background: color-mix(in srgb, var(--bg-panel) 78%, var(--surface));
    }
    .ventas-pos-product-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
      gap: 0.65rem;
      max-height: min(62vh, 38rem);
      overflow-y: auto;
      padding-right: 0.25rem;
    }
    .ventas-pos-stock-context {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem 0.5rem;
      align-items: baseline;
      font-size: 0.82rem;
      padding: 0.5rem 0.65rem;
      border: 1px solid color-mix(in srgb, var(--color-primary, var(--accent)) 35%, var(--border-subtle));
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--color-primary-soft, var(--accent-soft)) 22%, var(--surface));
    }
    .ventas-pos-stock-context-label {
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      width: 100%;
    }
    .ventas-pos-bodega-warning {
      margin: 0;
    }
    .ventas-pos-filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      justify-content: flex-end;
    }
    .ventas-pos-filter-chips .is-active {
      border-color: var(--color-primary, var(--accent));
      color: var(--color-primary, var(--accent));
      background: color-mix(in srgb, var(--color-primary-soft, var(--accent-soft)) 45%, transparent);
    }
    .ventas-pos-cart {
      position: sticky;
      top: 0.5rem;
      padding: 1rem;
      border-radius: calc(var(--radius-sm, 6px) + 4px);
      border: 1px solid color-mix(in srgb, var(--border) 70%, var(--color-primary, var(--accent)));
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--surface) 92%, var(--color-primary-soft, var(--accent-soft))) 0%,
        color-mix(in srgb, var(--surface) 92%, var(--bg-panel)) 100%
      );
      box-shadow: 0 12px 30px color-mix(in srgb, #000 18%, transparent);
    }
    .ventas-pos-cart--ready {
      border-color: color-mix(in srgb, var(--color-success, #22c55e) 45%, var(--border));
    }
    .ventas-pos-cart-heading {
      font-size: 1rem;
      margin: 0;
    }
    .ventas-pos-cart-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .ventas-pos-cart-count {
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      background: var(--surface);
      color: var(--muted);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .ventas-pos-sale-fields {
      padding: 0.55rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 86%, transparent);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
    .ventas-pos-note-field {
      grid-column: 1 / -1;
    }
    .ventas-pos-new-client-card {
      padding: 1rem;
    }
    .ventas-pos-new-client-row {
      flex-wrap: wrap;
      gap: var(--space-ds-4);
      align-items: flex-end;
    }
    .ventas-pos-new-client-field {
      min-width: 10rem;
    }
    .ventas-pos-new-client-field--name {
      min-width: 12rem;
    }
    .ventas-pos-cart-empty {
      margin: 0.5rem 0 0;
      padding: 0.95rem;
      font-size: 0.875rem;
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 85%, var(--bg-panel));
    }
    .ventas-pos-empty-copy {
      margin: 0.25rem 0 0;
    }
    .ventas-pos-cart-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem 0.75rem;
      align-items: center;
      padding: 0.55rem 0.65rem;
      font-size: 0.76rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: var(--surface);
    }
    .ventas-pos-lines {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: min(42vh, 22rem);
      overflow-y: auto;
    }
    .ventas-pos-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--muted);
    }
    .ventas-pos-total {
      color: var(--text);
      font-size: 1.95rem;
      font-variant-numeric: tabular-nums;
    }
    .ventas-pos-checkout-zone {
      margin-top: 0.75rem;
      padding: 1.05rem;
      border-radius: calc(var(--radius-sm, 6px) + 3px);
      border: 1px solid color-mix(in srgb, var(--color-primary, var(--accent)) 38%, var(--border-subtle));
      background: color-mix(in srgb, var(--color-primary-soft, var(--accent-soft)) 18%, var(--surface));
    }
    .ventas-pos-checkout-zone--ready {
      border-color: color-mix(in srgb, var(--color-success, #22c55e) 42%, var(--border-subtle));
      background: color-mix(in srgb, var(--color-success, #22c55e) 8%, var(--surface));
    }
    .ventas-pos-checkout-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.45rem;
    }
    .ventas-pos-checkout-label,
    .ventas-pos-ready-pill {
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }
    .ventas-pos-checkout-label {
      color: var(--muted);
    }
    .ventas-pos-ready-pill {
      padding: 0.16rem 0.45rem;
      border-radius: 999px;
      color: var(--text);
      background: color-mix(in srgb, var(--color-success, #22c55e) 18%, transparent);
    }
    .ventas-pos-confirm {
      width: 100%;
      margin-top: 0.65rem;
      min-height: 3.05rem;
      font-size: 1rem;
      font-weight: 800;
    }
    .ventas-pos-ready-hint {
      margin: 0.4rem 0 0;
      font-size: 0.78rem;
      color: var(--text);
      font-weight: 500;
    }
    .ventas-pos-admin-zero-hint {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
    }
    .ventas-pos-catalog-empty {
      margin: 0;
      padding: 0.75rem;
      font-size: 0.875rem;
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
    }
    .ventas-history-card {
      margin-top: 0.1rem;
      padding: 0.65rem 0.8rem;
      border-color: var(--border-subtle);
      background: color-mix(in srgb, var(--surface) 80%, transparent);
    }
    .ventas-history-summary {
      cursor: pointer;
      list-style: none;
    }
    .ventas-history-summary::-webkit-details-marker {
      display: none;
    }
    .ventas-history-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
      padding-bottom: 0;
    }
    .ventas-history-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
    }
    .ventas-history-actions--toolbar {
      margin-top: 0.75rem;
    }
    .ventas-history-count {
      padding: 0.22rem 0.5rem;
      border-radius: 999px;
      color: var(--muted);
      background: var(--surface);
      font-size: 0.76rem;
      font-weight: 700;
    }
    .ventas-history-filters {
      display: grid;
      grid-template-columns: repeat(6, minmax(8rem, 1fr));
      gap: 0.65rem;
      align-items: end;
      margin-top: 0.75rem;
      padding: 0.65rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--bg-panel) 38%, transparent);
    }
    .ventas-history-empty {
      margin: 0;
      padding: 1rem;
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-sm, 6px);
      background: color-mix(in srgb, var(--surface) 82%, var(--bg-panel));
    }
    .ventas-history-table thead th {
      color: var(--muted);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: color-mix(in srgb, var(--bg-panel) 74%, transparent);
    }
    .ventas-history-table td,
    .ventas-history-table th {
      padding-block: 0.7rem;
    }
    .ventas-history-detail-link {
      display: inline-flex;
      align-items: center;
      padding: 0.18rem 0.45rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--color-primary-soft, var(--accent-soft)) 40%, transparent);
      font-weight: 700;
    }
    .ventas-history-receipt-link {
      margin-left: 0.35rem;
      font-size: 0.82rem;
      color: var(--muted);
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly bodegas = signal<Bodega[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly clientes = signal<ClienteListItem[]>([]);
  readonly usuariosFiltro = signal<UsuarioRow[]>([]);
  readonly stockPorProducto = signal<Map<number, number>>(new Map());
  readonly busqueda = signal('');
  readonly filtroStock = signal<PosStockFilter>('todos');
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
  readonly stockError = signal<string | null>(null);
  readonly resumen = signal<VentaPanelResumen | null>(null);
  readonly resumenLoading = signal(false);
  readonly historial = signal<VentaListItem[]>([]);
  readonly historialLoading = signal(false);
  readonly confirmando = signal(false);
  readonly pagandoStripe = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  private stockRequestSeq = 0;

  readonly canRegistrar = computed(() => this.auth.hasAnyRole(ROLES_VENTA_REGISTRO));
  readonly puedePrecioCero = computed(() => this.auth.hasAnyRole(ROLES_ADMIN));
  readonly puedeFiltrarVendedor = computed(() => this.auth.hasAnyRole(ROLES_ADMIN));

  /** Workspace tipo POS solo para el rol comercial. */
  readonly esModoPos = computed(() => this.auth.role() === ROLE_CODE_VENTAS);

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
    const filtro = this.filtroStock();
    let all = this.productos().filter((p) => p.activo);
    if (this.bodegaId != null && !this.stockCargando()) {
      if (filtro === 'disponibles') {
        all = all.filter((p) => this.stockDisponible(p.id) > 0);
      } else if (filtro === 'agotados') {
        all = all.filter((p) => this.stockDisponible(p.id) <= 0);
      }
    }
    if (!q) return all.slice(0, 80);
    return all
      .filter((p) => p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
      .slice(0, 80);
  });

  readonly totalVenta = computed(() =>
    this.lineas().reduce((acc, l) => acc + this.subtotalLinea(l), 0)
  );

  readonly stockBloqueante = computed(() => this.lineas().some((l) => this.filaStockInvalida(l)));

  readonly unidadesCarrito = computed(() =>
    this.lineas().reduce((acc, l) => acc + (Number.isFinite(l.cantidad) ? l.cantidad : 0), 0)
  );

  /** Carrito válido para iniciar Checkout (mensaje de “listo” sin duplicar lógica del botón). */
  readonly listoParaCobrar = computed(() => {
    if (this.pagandoStripe()) {
      return false;
    }
    if (this.bodegaId == null || this.lineas().length === 0 || this.stockBloqueante() || this.totalVenta() <= 0) {
      return false;
    }
    if (!this.puedePrecioCero() && this.lineas().some((l) => l.precioUnitario <= 0)) {
      return false;
    }
    if (this.lineas().some((l) => !(l.cantidad > 0) || l.precioUnitario < 0 || !Number.isFinite(l.cantidad))) {
      return false;
    }
    return true;
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      if (q.get('limpiar') !== '1' || this.auth.role() !== ROLE_CODE_VENTAS) {
        return;
      }
      this.limpiarCarritoPosTrasVenta();
      void this.router.navigate(['/app', 'ventas'], { replaceUrl: true, queryParams: {} });
    });

    this.bodegaApi.list().subscribe((b) => {
      const activas = b.filter((x) => x.activo);
      this.bodegas.set(activas);
      if (this.esModoPos() && this.bodegaId == null && activas.length > 0) {
        this.bodegaId = activas[0].id;
        this.recargarStockBodega();
      }
    });
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
      return 'Anulada (stock revertido)';
    }
    if (estado === 'ANULACION_SOLICITADA') {
      return 'Anulación solicitada';
    }
    if (estado === 'PENDIENTE_PAGO') {
      return 'Pendiente pago';
    }
    if (estado === 'CANCELADA_SIN_PAGO') {
      return 'Cancelada sin pago';
    }
    return estado;
  }

  estadoVentaBadgeClass(estado: string): string {
    if (estado === 'CONFIRMADA') return 'badge badge-ok';
    if (estado === 'ANULADA') return 'badge badge-off';
    if (estado === 'ANULACION_SOLICITADA' || estado === 'PENDIENTE_PAGO') return 'badge badge-pending';
    return 'badge badge-muted';
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
    this.stockError.set(null);
    this.recargarStockBodega();
  }

  recargarStockBodega(): void {
    const bid = this.bodegaId;
    const requestId = ++this.stockRequestSeq;
    if (bid == null) {
      this.stockCargando.set(false);
      this.stockError.set(null);
      this.stockPorProducto.set(new Map());
      return;
    }
    this.stockCargando.set(true);
    this.stockError.set(null);
    const acc = new Map<number, number>();
    const loadPage = (page: number): void => {
      this.inventarioApi.list(page, 500, { bodegaId: bid }).subscribe({
        next: (p) => {
          if (requestId !== this.stockRequestSeq || this.bodegaId !== bid) {
            return;
          }
          for (const row of p.content) {
            const pid = row.productoId;
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
          if (requestId !== this.stockRequestSeq || this.bodegaId !== bid) {
            return;
          }
          this.stockPorProducto.set(acc);
          this.stockError.set('No se pudo cargar el stock de la bodega seleccionada. Actualizá o elegí otra bodega.');
          this.stockCargando.set(false);
        }
      });
    };
    loadPage(0);
  }

  stockDisponible(productoId: number): number {
    return this.stockPorProducto().get(productoId) ?? 0;
  }

  cantidadEnCarrito(productoId: number): number {
    return this.lineas().find((line) => line.productoId === productoId)?.cantidad ?? 0;
  }

  bodegaSeleccionadaLabel(): string {
    if (this.bodegaId == null) {
      return 'sin bodega seleccionada';
    }
    const b = this.bodegas().find((x) => x.id === this.bodegaId);
    return b ? `${b.codigo} — ${b.nombre}` : `bodega #${this.bodegaId}`;
  }

  productoDisponible(productoId: number): boolean {
    return this.bodegaId != null && !this.stockCargando() && this.cantidadMaximaProducto(productoId) >= 1;
  }

  cantidadMaximaProducto(productoId: number): number {
    const stock = this.stockDisponible(productoId);
    return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
  }

  availabilityState(productoId: number): 'available' | 'low' | 'out' | 'loading' | 'no-warehouse' {
    if (this.bodegaId == null) {
      return 'no-warehouse';
    }
    if (this.stockCargando()) {
      return 'loading';
    }
    const stock = this.stockDisponible(productoId);
    if (stock <= 0) {
      return 'out';
    }
    if (stock <= 3) {
      return 'low';
    }
    return 'available';
  }

  availabilityLabel(productoId: number): string {
    const state = this.availabilityState(productoId);
    if (state === 'no-warehouse') return 'Elegí bodega';
    if (state === 'loading') return 'Verificando stock';
    if (state === 'out') return 'Agotado';
    if (state === 'low') return 'Stock bajo';
    return 'Disponible';
  }

  addButtonTitle(productoId: number): string {
    if (this.bodegaId == null) {
      return 'Elegí una bodega para cargar stock.';
    }
    if (this.stockCargando()) {
      return 'Esperá a que termine la carga de stock.';
    }
    if (this.cantidadMaximaProducto(productoId) < 1) {
      return 'Sin stock en la bodega seleccionada.';
    }
    return 'Agregar producto al carrito.';
  }

  cantidadMaximaTitle(line: DraftLine): string {
    if (this.pagandoStripe()) {
      return 'No se puede editar mientras se abre el cobro.';
    }
    if (this.stockCargando()) {
      return 'Esperá a que termine la carga de stock.';
    }
    if (line.cantidad >= this.cantidadMaximaProducto(line.productoId)) {
      return 'Ya está en el máximo disponible para esta bodega.';
    }
    return 'Aumentar cantidad';
  }

  /** Precio de lista del maestro (venta); si no es válido, 0. */
  precioListaProducto(p: Producto): number {
    const raw = p.salePrice;
    const n = typeof raw === 'string' ? parseFloat(String(raw).replace(',', '.')) : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  agregarLinea(): void {
    const bid = this.bodegaId;
    const pid = this.productoElegidoId;
    if (bid == null) {
      this.error.set('Elegí una bodega para cargar stock antes de agregar productos.');
      return;
    }
    if (pid == null || this.stockCargando()) return;
    if (this.lineas().some((l) => l.productoId === pid)) {
      this.error.set('Este producto ya está en el detalle.');
      this.planFollowup.set(null);
      return;
    }
    const p = this.productos().find((x) => x.id === pid);
    if (!p) return;
    this.error.set(null);
    const disp = this.cantidadMaximaProducto(pid);
    if (disp < 1) {
      this.error.set('No hay stock disponible en la bodega seleccionada para este producto.');
      return;
    }
    const precioUnitario = this.precioListaProducto(p);
    this.lineas.update((lines) => [
      ...lines,
      {
        productoId: pid,
        codigo: p.codigo,
        nombre: p.nombre,
        cantidad: 1,
        precioUnitario
      }
    ]);
    this.productoElegidoId = null;
  }

  agregarProductoRapido(p: Producto): void {
    this.productoElegidoId = p.id;
    this.agregarLinea();
  }

  quitarLinea(productoId: number): void {
    if (this.pagandoStripe()) {
      return;
    }
    this.lineas.update((lines) => lines.filter((l) => l.productoId !== productoId));
  }

  actualizarCantidad(productoId: number, raw: number | string): void {
    if (this.pagandoStripe()) {
      return;
    }
    const n = typeof raw === 'string' ? parseFloat(raw) : raw;
    this.lineas.update((lines) =>
      lines.map((l) => {
        if (l.productoId !== productoId) {
          return l;
        }
        const cantidad = this.esModoPos()
          ? this.cantidadCarritoValida(productoId, n, l.cantidad)
          : Number.isFinite(n)
            ? n
            : l.cantidad;
        return { ...l, cantidad };
      })
    );
  }

  incrementarCantidad(productoId: number): void {
    if (this.pagandoStripe()) {
      return;
    }
    this.lineas.update((lines) =>
      lines.map((l) =>
        l.productoId === productoId ? { ...l, cantidad: this.cantidadCarritoValida(productoId, l.cantidad + 1, l.cantidad) } : l
      )
    );
  }

  disminuirCantidad(productoId: number): void {
    if (this.pagandoStripe()) {
      return;
    }
    this.lineas.update((lines) =>
      lines.map((l) =>
        l.productoId === productoId ? { ...l, cantidad: this.cantidadCarritoValida(productoId, l.cantidad - 1, l.cantidad) } : l
      )
    );
  }

  private cantidadCarritoValida(productoId: number, raw: number, fallback: number): number {
    const max = this.cantidadMaximaProducto(productoId);
    if (max < 1) {
      return fallback;
    }
    if (!Number.isFinite(raw)) {
      return fallback;
    }
    return Math.min(max, Math.max(1, Math.floor(raw)));
  }

  actualizarPrecio(productoId: number, raw: number | string): void {
    if (this.pagandoStripe()) {
      return;
    }
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

  /** Limpia el carrito del POS tras una venta con tarjeta confirmada (enlace con ?limpiar=1). */
  private limpiarCarritoPosTrasVenta(): void {
    this.lineas.set([]);
    this.observacion = '';
    this.clienteId = null;
    this.busqueda.set('');
    this.error.set(null);
    this.mostrarNuevoCliente.set(false);
    this.nuevoClienteNombre = '';
    this.nuevoClienteDocumento = '';
    this.nuevoClienteTelefono = '';
    if (this.bodegaId != null) {
      this.recargarStockBodega();
    }
    this.message.set('Carrito vacío. Podés armar la siguiente venta.');
    flashSuccess(this.destroyRef, () => this.message.set(null));
    this.cargarResumen();
    this.cargarHistorial();
  }

  irAPagarConStripe(): void {
    if (this.pagandoStripe()) {
      return;
    }
    const bid = this.bodegaId;
    if (bid == null || this.lineas().length === 0 || this.stockBloqueante() || this.totalVenta() <= 0) return;
    for (const l of this.lineas()) {
      if (!(l.cantidad > 0) || l.precioUnitario < 0 || !Number.isFinite(l.cantidad) || !Number.isFinite(l.precioUnitario)) {
        this.error.set('Revisá cantidades (> 0) y precios (≥ 0) en todas las líneas.');
        return;
      }
    }
    if (!this.puedePrecioCero() && this.lineas().some((l) => l.precioUnitario <= 0)) {
      this.error.set(
        'Cada línea debe tener precio unitario mayor a 0. Si necesitás cortesías a precio 0, un administrador debe registrar la venta.'
      );
      return;
    }
    this.pagandoStripe.set(true);
    this.error.set(null);
    this.message.set(null);
    this.planFollowup.set(null);
    const obs = this.observacion.trim() || undefined;
    this.ventaApi
      .prepararStripeCheckout({
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
        next: (r) => {
          globalThis.location.assign(r.checkoutUrl);
        },
        error: (e) => {
          this.pagandoStripe.set(false);
          this.message.set(null);
          this.error.set(getApiErrorMessage(e));
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
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
